/*
 * Copyright (c) 2003,2004 SRA, Inc.
 * Copyright (c) 2003,2004 SKC, Inc.
 *
 * Permission to use, copy, modify, and distribute this software and
 * its documentation for any purpose, without fee, and without a
 * written agreement is hereby granted, provided that the above
 * copyright notice and this paragraph and the following two
 * paragraphs appear in all copies.
 *
 * IN NO EVENT SHALL THE AUTHOR BE LIABLE TO ANY PARTY FOR DIRECT,
 * INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, INCLUDING
 * LOST PROFITS, ARISING OUT OF THE USE OF THIS SOFTWARE AND ITS
 * DOCUMENTATION, EVEN IF THE UNIVERSITY OF CALIFORNIA HAS BEEN ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * THE AUTHOR SPECIFICALLY DISCLAIMS ANY WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE.  THE SOFTWARE PROVIDED HEREUNDER IS ON AN "AS
 * IS" BASIS, AND THE AUTHOR HAS NO OBLIGATIONS TO PROVIDE MAINTENANCE,
 * SUPPORT, UPDATES, ENHANCEMENTS, OR MODIFICATIONS.
 */

#include <stddef.h>
#include <sys/types.h>
#include <windows.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <errno.h>

#include "dirent.h"

#define ASCII_ISALPHA(c) \
  (('A' <= (c) && (c) <= 'Z') || ('a' <= (c) && (c) <= 'z'))

DIR *
opendir(const char *dir)
{
    DIR *dp = NULL;
    char *findspec = NULL;
    HANDLE handle;
    size_t dirlen;
    int saved_errno;

    dirlen = strlen(dir);
    findspec = malloc(dirlen + 2 + 1);
    if (findspec == NULL) {
	errno = ENOMEM;
	goto failed;
    }

    if (dirlen == 0)
	strcpy(findspec, "*");
    else if (ASCII_ISALPHA(dir[0]) && dir[1] == ':' && dir[2] == '\0')
	sprintf(findspec, "%s*", dir);
    else if (dir[dirlen - 1] == '/' || dir[dirlen - 1] == '\\')
	sprintf(findspec, "%s*", dir);
    else
	sprintf(findspec, "%s\\*", dir);

    dp = (DIR *)malloc(sizeof(DIR));
    if (dp == NULL) {
	errno = ENOMEM;
	goto failed;
    }

    dp->offset = 0;
    dp->finished = 0;
    dp->dir = strdup(dir);
    if (dp->dir == NULL)
	goto failed;

    handle = FindFirstFile(findspec, &(dp->finddata));
    if (handle == INVALID_HANDLE_VALUE) {
	errno = ENOENT;
	goto failed;
    }
    dp->handle = handle;

    free(findspec);
    return dp;

    /*
     * An error occurs...
     */
  failed:
    saved_errno = errno;
    if (dp != NULL) {
	free(dp->dir);
	free(dp);
    }
    free(findspec);
    errno = saved_errno;

    return NULL;
}


struct dirent *
readdir(DIR *dp)
{
    if (dp == NULL || dp->finished)
	return NULL;

    if (dp->offset != 0) {
	if (FindNextFile(dp->handle, &(dp->finddata)) == 0) {
	    dp->finished = 1;
	    return NULL;
	}
    }
    dp->offset++;

    strncpy(dp->ent.d_name, dp->finddata.cFileName, MAX_PATH);
    dp->ent.d_ino = 1;

    return &(dp->ent);
}


int
closedir(DIR *dp)
{
    FindClose(dp->handle);
    free(dp->dir);
    free(dp);

    return 0;
}
