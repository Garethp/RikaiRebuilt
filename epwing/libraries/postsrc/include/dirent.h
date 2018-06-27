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

#ifndef DIRENT_H
#define DIRENT_H

#include <stddef.h>
#include <sys/types.h>
#include <stdlib.h>
#include <windows.h>

struct dirent {
    ino_t d_ino;		/* inode (always 1 on WIN32) */
    char d_name[MAX_PATH + 1];	/* filename (null terminated) */
};

typedef struct {
    HANDLE handle;		/* handle for FindFirstFile or FindNextFile */
    long offset;		/* offset into directory */
    int finished;		/* 1 if there are not more files */
    WIN32_FIND_DATA finddata;	/* file data FindFirstFile or FindNextFile
				 * returns */
    char *dir;			/* the directory path we are reading */
    struct dirent ent;		/* the dirent to return */
} DIR;

extern DIR *opendir(const char *);
extern struct dirent *readdir(DIR *);
extern int closedir(DIR *);

#endif /* DIRENT_H */
