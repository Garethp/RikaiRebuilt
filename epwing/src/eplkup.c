/*------------------------------------------------------------------------
--  Copyright (C) 2012-2015 Christopher Brochtrup
--
--  This file is part of eplkup.
--
--  eplkup is free software: you can redistribute it and/or modify
--  it under the terms of the GNU General Public License as published by
--  the Free Software Foundation, either version 3 of the License, or
--  (at your option) any later version.
--
--  eplkup is distributed in the hope that it will be useful,
--  but WITHOUT ANY WARRANTY; without even the implied warranty of
--  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
--  GNU General Public License for more details.
--
--  You should have received a copy of the GNU General Public License
--  along with eplkup.  If not, see <http://www.gnu.org/licenses/>.
--
------------------------------------------------------------------------*/
#define NO_STDIO_REDIRECT
#ifdef _WINDOWS
/* Compile as a "windows" subsystem to prevent console window from popping up,
   and set the entry point to main(), instead of WinMain() */
//#pragma comment(linker, "/SUBSYSTEM:windows /ENTRY:mainCRTStartup")
#endif

#include <fcntl.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <unistd.h>

#include "eb/eb.h"
#include "eb/error.h"
#include <eb/text.h>
#include <eb/font.h>

#include "eplkup_utils.h"
#include "eplkup_hook_handler.h"
#include "eplkup_data.h"
#include "eplkup_gaiji.h"

#include "easyJSON.h"
#include "NativeMessaging/NativeMessaging.h"

static void init(void);

static void print_title_to_out_file(void);

static void lookup_link(void);

static void lookup_word(void);

static void die(int exit_code);

static void parse_command_line(int argc, char *argv[]);

static void usage(int exit_code, char *msg);

static void handle_json(int exit_code);

static void write_out_file(char * output);

static void write_output(char * output);

static void write_error(char * error);
static void get_input(char *input);
static char* str_append(char* string1, char* string2);


/* Hooks - Used to process certain constructs as they come up (such as gaiji) */
static EB_Hookset hookset;
static EB_Hook hook_begin_subscript = {EB_HOOK_BEGIN_SUBSCRIPT, hook_set_begin_subscript};
static EB_Hook hook_begin_superscript = {EB_HOOK_BEGIN_SUPERSCRIPT, hook_set_begin_superscript};
static EB_Hook hook_end_subscript = {EB_HOOK_END_SUBSCRIPT, hook_set_end_subscript};
static EB_Hook hook_end_superscript = {EB_HOOK_END_SUPERSCRIPT, hook_set_end_superscript};
static EB_Hook hook_narrow_font = {EB_HOOK_NARROW_FONT, hook_set_narrow_font};
static EB_Hook hook_wide_font = {EB_HOOK_WIDE_FONT, hook_set_wide_font};
static EB_Hook hook_begin_keyword = {EB_HOOK_BEGIN_KEYWORD, hook_set_begin_keyword};
static EB_Hook hook_end_keyword = {EB_HOOK_END_KEYWORD, hook_set_end_keyword};
static EB_Hook hook_begin_emphasis = {EB_HOOK_BEGIN_EMPHASIS, hook_set_begin_emphasis};
static EB_Hook hook_end_emphasis = {EB_HOOK_END_EMPHASIS, hook_set_end_emphasis};
static EB_Hook hook_begin_reference = {EB_HOOK_BEGIN_REFERENCE, hook_set_begin_reference};
static EB_Hook hook_end_reference = {EB_HOOK_END_REFERENCE, hook_set_end_reference};

/* Inputs */
static char book_path[MAXLEN_PATH + 1] = "";       /* The path of the book */
static char in_path[MAXLEN_PATH + 1] = "";       /* The path of input file */
static char out_path[MAXLEN_PATH + 1] = "";       /* The path of the output file */
static int subbook_index = 0;        /* The subbook to use */
static int show_hit_count = 0;        /* 1 = Output the number of hits on the first line */
static int max_hits_to_output = MAX_HITS; /* The number of hits to output */
static int hit_to_output = -1;       /* The index of a particular hit to output */
static int print_heading = 1;        /* 1 = Print the hit heading */
static int print_text = 1;        /* 1 = Print the hit text */
static int print_hit_number = 0;        /* 1 = Output the hit number before each hit */
static int print_title = 0;        /* 1 = Output the title of the subbook */
static int input_is_link = 0;        /* 1 = Input file contains a link instead of a word */
static int set_emphasis_hook = 0;        /* 1 = User wants to set the bold/emphasis hook */
static int set_keyword_hook = 0;        /* 1 = User wants to set the keyword hook */
static int set_reference_hook = 0;        /* 1 = User wants to set the link/reference hook */
static int set_subscript_hook = 0;        /* 1 = User wants to set the subscript hook */
static int set_superscript_hook = 0;        /* 1 = User wants to set the superscript hook */

static char conv_buf[MAXLEN_CONV + 1];      /* Storage for encoding conversion */
static char final_buf[MAXLEN_CONV + 1];     /* Text that will be output to file */
static char text[MAXLEN_TEXT + 1];          /* Entry text */
static char heading[MAXLEN_HEADING + 1];    /* Entry heading */
static char title[EB_MAX_TITLE_LENGTH + 1]; /* Subbook title */

static bool json_mode = false;
static easyJSON json_input;

static EB_Book book; /* The EPWING book object */


/*------------------------------------------------------------------------
-- Name: main
--
------------------------------------------------------------------------*/
int main(int argc, char *argv[]) {
    /* Parse the command line arguments */
    parse_command_line(argc, argv);

    /* Initialize */
    init();

    /* If the user wants to print the subbook title to the output file instead of performing a search */
    if (print_title) {
        print_title_to_out_file();
    }
        /* Else if the input file contains a link instead of a word */
    else if (input_is_link) {
        lookup_link();
    }
        /* Else, it is a normal word lookup */
    else {
        lookup_word();
    }

    die(0);

    return 0;

} /* main */


/*------------------------------------------------------------------------
-- Name: init
--
-- Description:
--   Initialize EB Lib, set hooks, open the desired subbook.
--
-- Parameters:
--   None.
--
-- Returns:
--   None.
--
------------------------------------------------------------------------*/
static void init(void) {
    EB_Error_Code error_code;
    EB_Subbook_Code subbook_list[EB_MAX_SUBBOOKS];
    int subbook_count;
    char error[999];

    /* Init EB Lib */
    eb_initialize_library();
    eb_initialize_book(&book);
    eb_initialize_hookset(&hookset);

    /* Set hooks */
    eb_set_hook(&hookset, &hook_narrow_font);
    eb_set_hook(&hookset, &hook_wide_font);

    if (set_emphasis_hook) {
        eb_set_hook(&hookset, &hook_begin_emphasis);
        eb_set_hook(&hookset, &hook_end_emphasis);
    }

    if (set_keyword_hook) {
        eb_set_hook(&hookset, &hook_begin_keyword);
        eb_set_hook(&hookset, &hook_end_keyword);
    }

    if (set_reference_hook) {
        eb_set_hook(&hookset, &hook_begin_reference);
        eb_set_hook(&hookset, &hook_end_reference);
    }

    if (set_subscript_hook) {
        eb_set_hook(&hookset, &hook_begin_subscript);
        eb_set_hook(&hookset, &hook_end_subscript);
    }

    if (set_superscript_hook) {
        eb_set_hook(&hookset, &hook_begin_superscript);
        eb_set_hook(&hookset, &hook_end_superscript);
    }

    /* Open the EPWING book */
    error_code = eb_bind(&book, book_path);

    if (error_code != EB_SUCCESS) {
        sprintf(error, "Failed to bind the book, %s: %s", eb_error_message(error_code), book_path);
        write_error(error);
    }

    /* Get the subbook list */
    error_code = eb_subbook_list(&book, subbook_list, &subbook_count);

    if (error_code != EB_SUCCESS) {
        sprintf(error, "Failed to get the subbbook list, %s", eb_error_message(error_code));
        write_error(error);
    }

    /* Get the subbook */
    error_code = eb_set_subbook(&book, subbook_list[subbook_index]);

    if (error_code != EB_SUCCESS) {
        sprintf(error, "Failed to set the current subbook, %s", eb_error_message(error_code));
        write_error(error);
    }

    /* Get the subbook directory (the name only, not the full path) */
    error_code = eb_subbook_directory(&book, subbook_directory);

    if (error_code != EB_SUCCESS) {
        sprintf(error, "Failed to get the subbook directory: %s", eb_error_message(error_code));
        write_error(error);
    }

    /* Set the font */
    if (eb_set_font(&book, EB_FONT_16) < 0) {
        sprintf(error, "Failed to set the font size: %s", eb_error_message(error_code));
        write_error(error);
    }

} /* init */


/*------------------------------------------------------------------------
-- Name: print_title_to_out_file
--
-- Description:
--   Print the title of the book to the output file.
--
-- Parameters:
--   None.
--
-- Returns:
--   None.
--
------------------------------------------------------------------------*/
static void print_title_to_out_file(void) {
    EB_Error_Code error_code;
    char *status_conv = NULL;
    FILE *out_file = NULL;
    char error[999];

    /* Get the title of the subbook */
    error_code = eb_subbook_title2(&book, subbook_index, title);

    if (error_code != EB_SUCCESS) {
        sprintf(error, "Failed to get the title: %s", eb_error_message(error_code));
        write_error(error);
    }

    /* Convert title from EUC-JP to UTF-8 */
    status_conv = convert_encoding(conv_buf, MAXLEN_CONV, title, EB_MAX_TITLE_LENGTH, "UTF-8", "EUC-JP");

    if (status_conv == NULL) {
        write_error("Something went wrong when trying to encode the title");
    }

    write_output(conv_buf);
} /* print_title_to_out_file */


/*------------------------------------------------------------------------
-- Name: lookup_link
--
-- Description:
--   Lookup the input link and send the results to the output file.
--
-- Parameters:
--   None.
--
-- Returns:
--   None.
--
------------------------------------------------------------------------*/
static void lookup_link(void) {
    EB_Error_Code error_code;
    EB_Position position;
    FILE *in_file = NULL;
    FILE *out_file = NULL;
    char link_text[MAXLEN_LOOKUP_WORD] = "";
    char *status_conv = NULL;
    ssize_t text_length;
    int parse_result;

    char error[999];

    get_input(link_text);

    /* Parse the location of the link in the subbook */
    parse_result = sscanf(link_text, "%X %X", &position.page, &position.offset);

    /* If link was not parsed correctly (2 is the expected number of fields in the input file) */
    if (parse_result != 2) {
        sprintf(error, "Could not parse link from input file, %d.", parse_result);
        write_error(error);
    }

    error_code = eb_seek_text(&book, &position);

    if (error_code != EB_SUCCESS) {
        sprintf(error, "Failed to seek text, \"%s\"", eb_error_message(error_code));
        write_error(error);
    }

    error_code = eb_read_text(&book, NULL, &hookset, NULL, MAXLEN_TEXT, text, &text_length);

    if (error_code != EB_SUCCESS) {
        sprintf(error, "Failed to read text, \"%s\"", eb_error_message(error_code));
        write_error(error);
    }

    /* Convert from EUC-JP to UTF-8 */
    status_conv = convert_encoding(conv_buf, MAXLEN_CONV, text, text_length, "UTF-8", "EUC-JP");

    if (status_conv == NULL) {
        write_error("Something went wrong when trying to encode the the text");
    }

    /* Replace gaiji that have UTF-8 equivalents */
    replace_gaiji_with_utf8(final_buf, conv_buf);

    write_output(final_buf);
} /* lookup_link */


/*------------------------------------------------------------------------
-- Name: lookup_word
--
-- Description:
--   Lookup the input word and send the results to the output file.
--
-- Parameters:
--   None.
--
-- Returns:
--   None.
--
------------------------------------------------------------------------*/
static void lookup_word(void) {
    char lookup_word_utf8[MAXLEN_LOOKUP_WORD + 1];
    char lookup_word_eucjp[MAXLEN_LOOKUP_WORD + 1];
    char *status_conv = NULL;
    EB_Error_Code error_code;
    EB_Hit hits[MAX_HITS];
    FILE *in_file = NULL;
    FILE *out_file = NULL;
    int hit_count;
    ssize_t heading_length;
    ssize_t text_length;
    int i;
    char error[999];
    char* output = "";
    char output_buffer[999];

    get_input(lookup_word_utf8);

    /* Convert the lookup word from UTF-8 to EUC-JP */
    status_conv = convert_encoding(lookup_word_eucjp, MAXLEN_LOOKUP_WORD, lookup_word_utf8, strlen(lookup_word_utf8),
                                   "EUC-JP", "UTF-8");

    if (status_conv == NULL) {
        write_error("Something went wrong when trying to encode the lookup word");
    }


    /* Perform an exact search of the lookup word */
    error_code = eb_search_exactword(&book, lookup_word_eucjp);

    if (error_code != EB_SUCCESS) {
        sprintf("Failed to search for the word, %s: %s", eb_error_message(error_code), lookup_word_eucjp);
        write_error(error);
    }

    while (1) {
        /* Get the list of hits */
        error_code = eb_hit_list(&book, MAX_HITS, hits, &hit_count);

        if (error_code != EB_SUCCESS) {
            sprintf(error, "Failed to get hit entries, %s", eb_error_message(error_code));
            write_error(error);
        }

        /* Are we done? */
        if (hit_count == 0) {
            break;
        }


        /* Output only the number of hits? */
        if (show_hit_count) {
            sprintf(output_buffer, "{HITS: %d}\n", hit_count);
            output = str_append(output, output_buffer);
        }

        /* Determine the max number of hits to output */
        hit_count = MIN(hit_count, max_hits_to_output);

        /* For each search hit, print the hit information to the output file */
        for (i = 0; i < hit_count; i++) {
            /* Did the user specify a particular hit index to output? */
            if (hit_to_output >= 0) {
                i = hit_to_output;
            }

            /* Output the hit number */
            if (print_hit_number && (hit_count > 1) && (hit_to_output == -1)) {
                sprintf(output_buffer, "{ENTRY: %d}\n", i);
                output = str_append(output, output_buffer);
            }

            /* Print the heading of the hit to file */
            if (print_heading) {
                /* Seek to the heading */
                error_code = eb_seek_text(&book, &(hits[i].heading));

                if (error_code != EB_SUCCESS) {
                    sprintf(error, "Failed to seek the subbook, %s", eb_error_message(error_code));
                    write_error(error);
                }

                /* Read the heading */
                error_code = eb_read_heading(&book, NULL, &hookset, NULL, MAXLEN_HEADING, heading, &heading_length);

                if (error_code != EB_SUCCESS) {
                    sprintf(error, "Failed to read the subbook, %s", eb_error_message(error_code));
                    write_error(error);
                }

                /* Convert from EUC-JP to UTF-8 */
                status_conv = convert_encoding(conv_buf, MAXLEN_CONV, heading, heading_length, "UTF-8", "EUC-JP");

                if (status_conv == NULL) {
                    write_error("Something went wrong when trying to encode the the heading");
                }

                /* Replace gaiji that have UTF-8 equivalents */
                replace_gaiji_with_utf8(final_buf, conv_buf);

                sprintf(output_buffer, "%s\n", conv_buf);
                output = str_append(output, output_buffer);
            }

            /* Print the text of the hit to file */
            if (print_text) {
                /* Seek to the text */
                error_code = eb_seek_text(&book, &(hits[i].text));

                if (error_code != EB_SUCCESS) {
                    sprintf(error, "Failed to seek the subbook, %s", eb_error_message(error_code));
                    write_error(error);
                }

                /* Read the text*/
                error_code = eb_read_text(&book, NULL, &hookset, NULL, MAXLEN_TEXT, text, &text_length);

                if (error_code != EB_SUCCESS) {
                    sprintf(error, "Failed to read the subbook, %s", eb_error_message(error_code));
                    write_error(error);
                }
            }

            /* Convert from EUC-JP to UTF-8 */
            status_conv = convert_encoding(conv_buf, MAXLEN_CONV, text, text_length, "UTF-8", "EUC-JP");

            if (status_conv == NULL) {
                write_error("Something went wrong when trying to encode the the text");
            }

            /* Replace gaiji that have UTF-8 equivalents */
            replace_gaiji_with_utf8(final_buf, conv_buf);

            output = str_append(output, final_buf);

            /* Since the user specified a hit index, don't display the other hits */
            if (hit_to_output >= 0) {
                break;
            }
        }

        write_output(output);
        free(output);
//        fclose(out_file);
    }

} /* lookup_word */


/*------------------------------------------------------------------------
-- Name: die
--
-- Description:
--   Cleanup resources and exit.
--
-- Parameters:
--   (IN) exit_code - The exit code to use.
--
-- Returns:
--   None.
--
------------------------------------------------------------------------*/
static void die(int exit_code) {
    eb_finalize_book(&book);
    eb_finalize_library();
    eb_finalize_hookset(&hookset);

    exit(exit_code);

} /* die */


/*------------------------------------------------------------------------
-- Name: parse_command_line
--
-- Description:
--   Parse the command line arguments.
--
-- Parameters:
--   None.
--
-- Returns:
--   None.
--
------------------------------------------------------------------------*/
void parse_command_line(int argc, char *argv[]) {
    int i;
    FILE *fp = NULL;
    char *status_conv = NULL;

    if (argv == NULL) {
        write_error("Could not determine arguments");
    }

    /* For each argument */
    for (i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--emphasis") == 0) {
            set_emphasis_hook = 1;
        } else if (strcmp(argv[i], "--gaiji") == 0) {
            i++;
            gaiji_option = atoi(argv[i]);

            if ((gaiji_option < GAIJI_OPTION_DEFAULT) || (gaiji_option > GAIJI_OPTION_HTML_IMG)) {
                usage(1, "Bad --gaiji option!\n");
            }
        } else if (strcmp(argv[i], "--help") == 0) {
            usage(0, "");
        } else if (strcmp(argv[i], "--json") == 0) {
            handle_json(0);
        } else if (strcmp(argv[i], "--hit") == 0) {
            i++;
            hit_to_output = atoi(argv[i]);

            if (hit_to_output < 0) {
                usage(1, "Bad --hit option!\n");
            }
        } else if (strcmp(argv[i], "--hit-num") == 0) {
            print_hit_number = 1;
        } else if (strcmp(argv[i], "--html-sub") == 0) {
            set_subscript_hook = 1;
        } else if (strcmp(argv[i], "--html-sup") == 0) {
            set_superscript_hook = 1;
        } else if (strcmp(argv[i], "--keyword") == 0) {
            set_keyword_hook = 1;
        } else if (strcmp(argv[i], "--link") == 0) {
            set_reference_hook = 1;
        } else if (strcmp(argv[i], "--link-in") == 0) {
            input_is_link = 1;
        } else if (strcmp(argv[i], "--max-hits") == 0) {
            i++;
            max_hits_to_output = atoi(argv[i]);

            if ((max_hits_to_output < 1) || (max_hits_to_output > MAX_HITS)) {
                usage(1, "Bad --max-hits option!\n");
            }
        } else if (strcmp(argv[i], "--no-header") == 0) {
            print_heading = 0;
        } else if (strcmp(argv[i], "--no-text") == 0) {
            print_text = 0;
        } else if (strcmp(argv[i], "--show-count") == 0) {
            show_hit_count = 1;
        } else if (strcmp(argv[i], "--subbook") == 0) {
            i++;
            subbook_index = atoi(argv[i]);

            if (subbook_index < 0) {
                usage(1, "Bad --subbook option!\n");
            }
        } else if (strcmp(argv[i], "--title") == 0) {
            print_title = 1;
        } else if (strcmp(argv[i], "--ver") == 0) {
            usage(0, "eplkup version 1.5 by Christopher Brochtrup.\n");
        } else {
            //Since we can't actually pass arguments to the application, we're going to assume it's for JSON
            if ((argc - i) < 3 && !json_mode) {
                handle_json(0);
//                usage(1, "Error: Incorrect number of arguments!\n");
            }

            if (!json_mode) {
                /* Get the book path */
                strncpy_len(book_path, argv[i], MAXLEN_PATH);

                /* Get the input file */
                i++;
                strncpy_len(in_path, argv[i], MAXLEN_PATH);

                /* Get the output file */
                i++;
                strncpy_len(out_path, argv[i], MAXLEN_PATH);
            }
        }
    }

} /* parse_command_line */


/*------------------------------------------------------------------------
-- Name: usage
--
-- Description:
--   Print usage information.
--
-- Parameters:
--   (IN) exist_code  - The exit code to return to the shell.
--   (IN) msg         - An additional message to print before the usage.
--                      Leave blank if desired.
--
-- Returns:
--   None.
--
------------------------------------------------------------------------*/
void usage(int exit_code, char *msg) {
    if (strlen(msg) > 0) {
        fprintf(stderr, "%s\n\n", msg);
    }

    printf("Usage: eplkup [--emphasis] [--gaiji] [--help] [--hit #] [--hit-num] [--html-sub] \\\n");
    printf("              [--html-sup] [--keyword] [--link] [--link-in] [--no-header] [--no-text] [--max-hits #] \\\n");
    printf("              [--show-count] [--subbook #] [--title] [--ver] <book-path> <input-file> <output-file>\n");
    printf("\n");
    printf("Performs an exact search on the provided word in the provided EPWING book.\n");
    printf("\n");
    printf("Required:\n");
    printf("  book-path    - Directory that contains the EPWING \"CATALOG\" or \"CATALOGS\" file.\n");
    printf("  input-file   - File that contains the word to lookup (in UTF-8 without BOM).\n");
    printf("  output-file  - File that will contain the lookup text (in UTF-8 without BOM).\n");
    printf("\n");
    printf("Optional:\n");
    printf("  --emphasis   - Place HTML <em></em> tags around bold/emphasized text.\n");
    printf("  --gaiji      - 0 = Replace gaiji with no UTF-8 equivalents with a '?' (default).\n");
    printf("                 1 = Replace gaiji with no UTF-8 equivalents with HTML image tags containing\n");
    printf("                     embedded base64 image data.\n");
    printf("  --help       - Show help.\n");
    printf("  --hit        - Specify which hit to output (starting at 0). If not specified, all hits will be output.\n");
    printf("  --hit-num    - Output the number of the hit above the hit output (if multiple hits). Ex: {ENTRY: 3}.\n");
    printf("  --html-sub   - Put HTML <sub></sub> tags around subscript text.\n");
    printf("  --html-sup   - Put HTML <sup></sup> tags around superscript text.\n");
    printf("  --keyword    - Put <KEYWORD></KEYWORD> tags around the keyword.\n");
    printf("  --link       - Put <LINK></LINK[page:offset]> tags around links/references.\n");
    printf("  --link-in    - The input file contains a link in the format: 'hex_page<whitespace>hex_offset'.\n");
    printf("  --max-hits   - Specify the number of hits to output when --hit is not specified. Default is %d.\n",
           MAX_HITS);
    printf("  --no-header  - Don't print the headers.\n");
    printf("  --no-text    - Don't print the text.\n");
    printf("  --show-count - Output the number of lookup hits in the first line of the output file. Ex. {HITS: 6}\n");
    printf("  --subbook    - The subbook to use in the EPWING book. Default is 0.\n");
    printf("  --title      - Get the title of the subbook.\n");
    printf("  --ver        - Show version.\n");

    printf("\n");

    exit(exit_code);

} /* usage */

void handle_json(int exit_code) {
    json_mode = true;

    NativeMessaging nativeMessaging = newNativeMessaging();

    easyJSON message = nativeMessaging.ReadJSON(fileno(stdin));
    json_input = message;

    char error[999];

    if (!message.IsString(message, "book_path")) {
        nativeMessaging.WriteError("book_path is a required value");
        exit(0);
    }

    if (!message.IsString(message, "input")) {
        write_error("field \"input\" is required, even if it's blank");
    }

    strncpy_len(book_path, message.GetString(message, "book_path"), MAXLEN_PATH);

    if (message.Has(message, "options")) {
        easyJSON options = message.Get(message, "options");

        gaiji_option = GAIJI_OPTION_DEFAULT;
        if (options.IsTrue(options, "emphasis")) {
            set_emphasis_hook = 1;
        }

        if (options.IsTrue(options, "gaiji")) {
            gaiji_option = GAIJI_OPTION_HTML_IMG;
        }

        if (options.IsInt(options, "hit")) {
            hit_to_output = options.GetInt(options, "hit");
        }

        if (options.IsTrue(options, "hit-num")) {
            print_hit_number = 1;
        }

        if (options.IsTrue(options, "html-sub")) {
            set_subscript_hook = 1;
        }

        if (options.IsTrue(options, "html-sup")) {
            set_superscript_hook = 1;
        }

        if (options.IsTrue(options, "keyword")) {
            set_keyword_hook = 1;
        }

        if (options.IsTrue(options, "link")) {
            set_reference_hook = 1;
        }

        if (options.IsTrue(options, "link-in")) {
            input_is_link = 1;
        }

        if (options.IsInt(options, "max-hits")) {
            int max_hits = options.GetInt(options, "max-hits");
            if (max_hits > MAX_HITS) {
                sprintf(error, "Cannot have max-hits higher than %i", MAX_HITS);
                write_error(error);
                exit(0);
            }

            max_hits_to_output = max_hits;
        }

        if (options.IsTrue(options, "no-header")) {
            print_heading = 0;
        }

        if (options.IsTrue(options, "no-text")) {
            print_text = 0;
        }

        if (options.IsTrue(options, "show-count")) {
            show_hit_count = 1;
        }

        if (options.IsInt(options, "subbook")) {
            subbook_index = options.GetInt(options, "subbook");
        }

        if (options.IsTrue(options, "title")) {
            print_title = 1;
        }
    }
}

void write_out_file(char * output) {
    FILE *out_file = NULL;

    out_file = fopen(out_path, "w");
    fwrite(output, 1, strlen(output), out_file);
    fclose(out_file);
}

void write_output(char * output) {
    if (!json_mode) {
        write_out_file(output);
        return;
    }

    easyJSON json = easyJSON_create();
    json.AddString(json, "output", output);

    NativeMessaging nativeMessaging = newNativeMessaging();
    nativeMessaging.WriteJSON(json);
    return;
}

void write_error(char * error) {
    if (!json_mode) {
        fprintf(stderr, "Error: %s\n", error);

        die(1);
        return;
    }

    NativeMessaging nativeMessaging = newNativeMessaging();
    nativeMessaging.WriteError(error);

    die(1);
    return;
}

void get_input(char *input) {
    if (!json_mode) {
        FILE *in_file = fopen(in_path, "r");
        char input_buffer[MAXLEN_LOOKUP_WORD + 1] = { 0 };

        if (in_file == NULL) {
            fprintf(stderr, "Error: Could not open input file: \"%s\"", in_path);
            exit(1);
        }

        fgets(input_buffer, MAXLEN_LOOKUP_WORD, in_file);
        fclose(in_file);

        if (input_buffer[strlen(input_buffer) - 1] == '\n') {
            input_buffer[strlen(input_buffer) - 1] = '\0';
        }

        strncpy(input, input_buffer, MAXLEN_LOOKUP_WORD - 1);
        input[MAXLEN_LOOKUP_WORD - 1] = 0;
        return;
    }

    strncpy(input, json_input.GetString(json_input, "input"), MAXLEN_LOOKUP_WORD - 1);
    input[MAXLEN_LOOKUP_WORD - 1] = 0;
}

char* str_append(char* string1, char* string2) {
    char * new_string;
    if((new_string = malloc(strlen(string1) + strlen(string2) + 1)) != NULL){
        new_string[0] = '\0';   // ensures the memory is an empty string
        strcat(new_string,string1);
        strcat(new_string,string2);
    } else {
        write_error("Unable to concatenate string. Memory allocation error");
    }

    return new_string;
}