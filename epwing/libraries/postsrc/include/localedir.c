/*                                                            -*- C -*-
 * Copyright (c) 2004  Motoyuki Kasahara
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the project nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE PROJECT AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE PROJECT OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

#include <stddef.h>
#include <windows.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <limits.h>
#include <sys/stat.h>
#include <direct.h>
#include <mbstring.h>

/*
 * Maximum length of path.
 */
#ifndef PATH_MAX
#define PATH_MAX	512
#endif

/*
 * wctype macros.
 */
#define ASCII_ISALPHA(c) \
 (('A' <= (c) && (c) <= 'Z') || ('a' <= (c) && (c) <= 'z'))
#define ASCII_TOUPPER(c) \
 (('a' <= (c) && (c) <= 'z') ? (c) - 0x20 : (c))

/*
 * stat macros.
 */
#ifndef S_ISREG
#define S_ISREG(m) (((m) & _S_IFMT) == _S_IFREG)
#endif
#ifndef S_ISDIR
#define S_ISDIR(m) (((m) & _S_IFMT) == _S_IFDIR)
#endif

/*
 * Default locale directory.
 */
#define DEFAULT_LOCALEDIR	"\\Program Files\\EB Library\\locale"

/*
 * Unexported functions.
 */
static int get_invoked_command(char *);
static int find_command_path(const char *, char *);
static int get_path_directory(const char *, char *);
static int get_absolute_path(const char *, char *);


/*
 * Return the base directory for message catalogs for bindtextdomain().
 */
const char *
localedir(void)
{
    static char localedir_buffer[PATH_MAX] = {'\0'};
    static const char *localedir_patterns[] = {
	"locale", "..\\locale", NULL
    };
    char command_directory[PATH_MAX];
    char buffer[PATH_MAX];
    char *separator;
    const char **pattern;
    struct stat sb;

    if (*localedir_buffer != '\0')
	return localedir_buffer;

    /*
     * Get an absolute path of argv[0].
     */
    if (!get_invoked_command(command_directory))
	goto failed;
    if (!find_command_path(command_directory, command_directory))
	goto failed;
    if (!get_absolute_path(command_directory, command_directory))
	goto failed;

    /*
     * Find the `locale' directory.
     */
    if (ASCII_ISALPHA(*command_directory)
	&& *(command_directory + 1) == ':' && *(command_directory + 2) == '\0')
	separator = "";
    else
	separator = "\\";

    for (pattern = localedir_patterns; *pattern != NULL; pattern++) {
	if (PATH_MAX <= _snprintf(buffer, PATH_MAX, "%s%s%s",
	    command_directory, separator, *pattern))
	    continue;
	if (stat(buffer, &sb) == 0 && S_ISDIR(sb.st_mode))
	    break;
    }
    if (*pattern == NULL)
	goto failed;
    strcpy(localedir_buffer, buffer);

    return localedir_buffer;

    /*
     * An error occurs...
     */
  failed:
    strcpy(localedir_buffer, DEFAULT_LOCALEDIR);
    return localedir_buffer;
}


/*
 * Get command (argv[0]) using GetCommandLine().
 * 
 * Upon successful return, the function puts the result into `command'.
 * It assumes that size of the buffer pointed by `command' is PATH_MAX
 * (including '\0').  The function also deletes quotation marks in
 * the command.
 *
 * We don't use CommanLineToArgvW(), since it doesn't return an expected
 * result.
 *
 * The function returns 1 upon success, 0 otherwise.
 */
static int
get_invoked_command(char *command)
{
    const char *command_line;
    const char *p;
    char *q;
    size_t copy_length;
    int within_quote;
    int character_length;
    char *last_dot;
    int i;

    command_line = GetCommandLine();
    if (command_line == NULL)
	return 0;

    /*
     * Remove quotation.
     */
    p = command_line;
    q = command;
    copy_length = 0;
    within_quote = 0;

    for (;;) {
	if (*p == '\0')
	    break;
	if (!within_quote && (*p == ' ' || *p == '\t'))
	    break;

	if (*p == '\"') {
	    within_quote = !within_quote;
	    p++;
	} else {
	    character_length = mblen(p, PATH_MAX - 1 - copy_length);
	    if (character_length <= 0
		|| PATH_MAX <= copy_length + character_length)
		return 0;
	    for (i = 0; i < character_length; i++, p++, q++)
		*q = *p;
	    copy_length += character_length;
	}
    }
    *q = '\0';

    /*
     * Append ".exe" to the command if it doesn't have.
     */
    last_dot = _mbsrchr(command, '.');
    if (last_dot == NULL || _stricmp(last_dot, ".exe") != 0) {
	if (PATH_MAX <= copy_length + 4)
	    return 0;
	strcat(command, ".exe");
    }

    return 1;
}


/*
 * Get a path of command.
 *
 * The function finds the directory path of `command'.  If `command'
 * has no directory portion, it may be the current directory or a path
 * listed in the PATH environment variable.
 * 
 * Upon successful return, the function puts the result into `path'.
 * It assumes that size of the buffer pointed by `path' is PATH_MAX
 * (including '\0').  Note that `path' may not be an absolute path.
 *
 * The function returns a wrong path, if the application has changed
 * the current directory and another executable file with the same
 * name exists in the new current directory or a relative path listed
 * in PATH.
 *
 * The function returns 1 upon success, 0 otherwise.
 */
static int
find_command_path(const char *command, char *path)
{
    const char *env_path;
    char *copied_path = NULL;
    char *semicolon;
    char buffer[PATH_MAX];
    char *p;
    struct stat sb;

    /*
     * Set `buffer' to command name with its path.
     */
    if (_mbschr(command, '/') != NULL
	|| _mbschr(command, '\\') != NULL
	|| (ASCII_ISALPHA(command[0]) && command[1] == ':')) {
	/*
	 * `command' contains a path separator or a drive letter.
	 * We set `command' to `buffer'.
	 */
	if (PATH_MAX <= _snprintf(buffer, PATH_MAX, "%s", command))
	    goto failed;

    } else {
	/*
	 * `command' doesn't contain a path separator or a drive letter.
	 * The binary execuatble exists at the current directory or a
	 * directory listed in PATH.
	 *
	 * If it exists at the current directory, we set `buffer' to
	 * ".\\<command>".
	 * Otherwise, we set `buffer' to "<path-dir>\\<command>", where
	 * <path-dir> is a directory listed in %PATH% and the command
	 * exists.
	 */

	env_path = getenv("PATH");
	if (env_path == NULL)
	    env_path = "";
	copied_path = (char *)malloc((strlen(env_path) + 3));
	if (copied_path == NULL)
	    goto failed;
	sprintf(copied_path, ".;%s", env_path);

	/*
	 * Search %PATH% for command.
	 */
	p = copied_path;
	for (;;) {
	    semicolon = _mbschr(p, ';');
	    if (semicolon != NULL)
		*semicolon = '\0';

	    if (*p == '\0') {
		if (PATH_MAX
		    <= _snprintf(buffer, PATH_MAX, ".\\%s", command))
		    goto failed;
	    } else {
		if (PATH_MAX
		    <= _snprintf(buffer, PATH_MAX, "%s\\%s", p, command))
		    goto failed;
	    }

	    if (stat(buffer, &sb) == 0 && S_ISREG(sb.st_mode))
		break;
	    if (semicolon == NULL) {
		strcpy(buffer, command);
		break;
	    }
	    p = semicolon + 1;
	}

	free(copied_path);
    }

    return get_path_directory(buffer, path);

    /*
     * An error occurs...
     */
  failed:
    if (copied_path != NULL)
	free(copied_path);
    return 0;
}


/*
 * Delete the file name portion from `path', like dirname(1) on UNIX.
 *
 * Upon return, the function puts the result into `directory'.  If `path'
 * has file name portion only, the function sets `directory' to ".".
 * The function assumes that size of the buffer pointed by `directory'
 * is PATH_MAX (including '\0').
 *
 * It returns 1 upon success, 0 otherwise.
 */
static int
get_path_directory(const char *path, char *directory)
{
    const char *p = path;
    const char *copy_end = NULL;
    size_t copy_length;

    /*
     * Find the end of directory part.
     */
    if (ASCII_ISALPHA(*p) && *(p + 1) == ':') {
	p += 2;
	copy_end = p;
    }
    while (*p == '/' || *p == '\\') {
	p++;
	copy_end = p;
    }

    while (*p != '\0') {
	if (*p == '/' || *p == '\\') {
	    copy_end = p++;
	    while (*p == '/' || *p == '\\')
		p++;
	} else {
	    p++;
	}
    }

    /*
     * Delete base name.
     */
    if (copy_end == NULL)
	strcpy(directory, ".");
    else {
	copy_length = copy_end - path;
	if (PATH_MAX <= copy_length)
	    return 0;
	memcpy(directory, path, copy_length);
	*(directory + copy_length) = '\0';
    }

    return 1;
}


/*
 * Convert `path' to absolute path.
 *
 * Upon return, the function puts the result into `absolute_directory'.
 * The function assumes that size of the buffer pointed by `absolute_path'
 * is PATH_MAX (including '\0').
 *
 * It returns 1 upon success, 0 otherwise.
 */
int
get_absolute_path(const char *path, char *absolute_path)
{
    char cwd[PATH_MAX];
    char buffer[PATH_MAX];

    if ((*path == '/' || *path == '\\') 
	&& (*(path + 1) == '/' || *(path + 1) == '\\')) {
	/*
	 * `path' is UNC path.  Nothing to be done.
	 */
	if (PATH_MAX <= strlen(path))
	    return 0;
	strcpy(absolute_path, path);

    } else if (ASCII_ISALPHA(*path) && *(path + 1) == ':'
	&& (*(path + 2) == '/' || *(path + 2) == '\\')) {
	/*
	 * `path' has a drive letter and it is an absolute path.
	 * Nothing to be done.
	 */
	if (PATH_MAX <= strlen(path))
	    return 0;
	strcpy(absolute_path, path);

    } else if (ASCII_ISALPHA(*path) && *(path + 1) == ':') {
	/*
	 * `path' has a drive letter but it is a relative path.
	 * Covert its path to an absolute path.
	 */
	if (_getdcwd(ASCII_TOUPPER(*path) - 'A' + 1, cwd, PATH_MAX) == NULL)
	    return 0;
	if (PATH_MAX <= _snprintf(buffer, PATH_MAX, "%s\\%s", cwd, path + 2))
	    return 0;
	strcpy(absolute_path, buffer);

    } else if (*path == '/' || *path == '\\') {
	/*
	 * `path' is has no drive letter and it is an absolute path.
	 * Add a drive letter.
	 */
	if (_getcwd(cwd, PATH_MAX) == NULL)
	    return 0;
	cwd[1] = '\0';
	if (PATH_MAX <= _snprintf(buffer, PATH_MAX, "%s:%s", cwd, path))
	    return 0;
	strcpy(absolute_path, buffer);

    } else {
	/*
	 * `path' has no drive letter and it is a relative path.
	 * Add a drive letter and convert it to an absolute path.
	 */
	if (_getcwd(cwd, PATH_MAX) == NULL)
	    return 0;
	if (PATH_MAX <= _snprintf(buffer, PATH_MAX, "%s\\%s", cwd, path))
	    return 0;
	strcpy(absolute_path, buffer);
    }

    return 1;
}
