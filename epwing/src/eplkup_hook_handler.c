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

#include <stdio.h>
#include <stdlib.h>
#include "string.h"

#include <eb/eb.h>
#include <eb/error.h>
#include <eb/text.h>
#include <eb/font.h>

#include "eplkup_hook_handler.h"
#include "eplkup_font.h"
#include "eplkup_data.h"
#include "eplkup_utils.h"
#include "eplkup_gaiji.h"

/*  */
EB_Error_Code hook_set_begin_candidate(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<begin_candidate>");
  return 0;
}

/*  */
EB_Error_Code hook_set_begin_color_bmp(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<begin_color_bmp>");
  return 0;
}

/*  */
EB_Error_Code hook_set_begin_color_jpeg(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<begin_color_jpeg>");
  return 0;
}

/* Used for the matched word. */
EB_Error_Code hook_set_begin_decoration(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  /* argv means italic or bold info */
  eb_write_text_string(book, "<begin_decoration>");
  return 0;
}

/* Bold/ephasis text */
EB_Error_Code hook_set_begin_emphasis(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<em>");
  return 0;
}

/*  */
EB_Error_Code hook_set_begin_gray_graphic(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<begin_gray_graphic>");
  return 0;
}

/*  */
EB_Error_Code hook_set_begin_in_color_bmp(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<begin_in_color_bmp>");
  return 0;
}

/*  */
EB_Error_Code hook_set_begin_in_color_jpeg(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<egin_in_color_jpeg>");
  return 0;
}

/* The start of the keyword. 
   In wadai5, seems to think the beginning of the line is a keyword. */
EB_Error_Code hook_set_begin_keyword(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<KEYWORD>");
  return 0;
}

/*  */
EB_Error_Code hook_set_begin_mono_graphic(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<begin_mono_graphic>");
  return 0;
}

/*  */
EB_Error_Code hook_set_begin_mpeg(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<begin_mpeg>");
  return 0;
}

/*  */
EB_Error_Code hook_set_begin_narrow(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<begin_narrow>");
  return 0;
}

/*  */
EB_Error_Code hook_set_begin_no_newline(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<begin_no_newline>");
  return 0;
}

/* A link/reference */
EB_Error_Code hook_set_begin_reference(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<LINK>");
  return 0;
}

/* Subscript */
EB_Error_Code hook_set_begin_subscript(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<sub>");
  return 0;
}

/* Superscript (x^2) */
EB_Error_Code hook_set_begin_superscript(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<sup>");
  return 0;
}

/*  */
EB_Error_Code hook_set_begin_wave(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<begin_wave>");
  return 0;
}

/*  */
EB_Error_Code hook_set_end_candidate_group(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<end_candidate_group>");
  return 0;
}

/*  */
EB_Error_Code hook_set_end_candidate_leaf(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<end_candidate_leaf>");
  return 0;
}

/*  */
EB_Error_Code hook_set_end_color_graphic(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<end_color_graphic>");
  return 0;
}

/*  */
EB_Error_Code hook_set_end_decoration(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<end_decoration>");
  return 0;
}

/* End of bold/emphasis text */
EB_Error_Code hook_set_end_emphasis(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "</em>");
  return 0;
}

/*  */
EB_Error_Code hook_set_end_gray_graphic(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<end_gray_graphic>");
  return 0;
}

/*  */
EB_Error_Code hook_set_end_in_color_graphic(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<end_in_color_graphic>");
  return 0;
}

/* The end of the keyword */
EB_Error_Code hook_set_end_keyword(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "</KEYWORD>");
  return 0;
}

/*  */
EB_Error_Code hook_set_end_mono_graphic(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<end_mono_graphic>");
  return 0;
}

/*  */
EB_Error_Code hook_set_end_mpeg(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<end_mpeg>");
  return 0;
}

/*  */
EB_Error_Code hook_set_end_narrow(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<end_narrow>");
  return 0;
}

/*  */
EB_Error_Code hook_set_end_no_newline(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<end_no_newline>");
  return 0;
}

/* End link/reference */
EB_Error_Code hook_set_end_reference(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  char link_text[100] = "";
  EB_Position position;

  position.page = argv[1];
  position.offset = argv[2];

  sprintf(link_text, "</LINK[%X:%X]>", position.page, position.offset);

  eb_write_text_string(book, link_text);
  return 0;
}

/* End subscript */
EB_Error_Code hook_set_end_subscript(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "</sub>");
  return 0;
}

/* End superscript */
EB_Error_Code hook_set_end_superscript(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "</sup>");
  return 0;
}

/*  */
EB_Error_Code hook_set_end_wave(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<end_wave>");
  return 0;
}

/*  */
EB_Error_Code hook_set_gb2312(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<gb2312>");
  return 0;
}

/*  */
EB_Error_Code hook_set_iso8859_1(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<iso8859_1>");
  return 0;
}

/* Gaiji - Narrow */
EB_Error_Code hook_set_narrow_font(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  char replacement[MAXLEN_PATH] = "";

  /* Check if there is a UTF-8 replacement for this gaiji code */
  if(get_gaiji_replacment_elem(subbook_directory, 'n', (unsigned short)argv[0]) != NULL)
  {
    sprintf(replacement, "{#n%04X}", argv[0]);
  }
  else if(gaiji_option == GAIJI_OPTION_HTML_IMG) /* Add HTML IMG tag */
  {    
    get_character_html_img(replacement, book, SAVE_BMP, SAVE_NARROW, argv[0]);
  }
  else
  {
    sprintf(replacement, "?");
  }
  
  eb_write_text_string(book, replacement);

  return 0;
}

/* Used for the normal English text */
EB_Error_Code hook_set_narrow_jisx0208(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<narrow_jisx0208>");
  return 0;
}

/* Newline */
EB_Error_Code hook_set_newline(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<newline>");
  return 0;
}

/*  */
EB_Error_Code hook_set_null(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<null>");
  return 0;
}

/* Indent  */
EB_Error_Code hook_set_indent(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<indent>");
  return 0;
}

/* Gaiji - Wide */
EB_Error_Code hook_set_wide_font(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  char replacement[MAXLEN_PATH] = "";

  /* Check if there is a UTF-8 replacement for this gaiji code */
  if(get_gaiji_replacment_elem(subbook_directory, 'w', (unsigned short)argv[0]) != NULL)
  {
    sprintf(replacement, "{#w%04X}", argv[0]);
  }
  else if(gaiji_option == GAIJI_OPTION_HTML_IMG) /* Add HTML IMG tag */
  {    
    get_character_html_img(replacement, book, SAVE_BMP, SAVE_WIDE, argv[0]);
  }
  else
  {
    sprintf(replacement, "?");
  }
  
  eb_write_text_string(book, replacement);

  return 0;
}

/* Used for the normal japanese text */
EB_Error_Code hook_set_wide_jisx0208(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv)
{
  eb_write_text_string(book, "<ide_jisx0208>");
  return 0;
}