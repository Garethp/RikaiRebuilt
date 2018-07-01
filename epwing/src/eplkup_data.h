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

#ifndef EPLKUP_DATA_H
#define EPLKUP_DATA_H

#include <eb/defs.h>

/* The maximum number of hits to output for a lookup word */
#define MAX_HITS           20

/* The maximum length of a lookup word */
#define MAXLEN_LOOKUP_WORD 127

/* The maximum length of a heading */
#define MAXLEN_HEADING     127

/* The maximum length of a file/path */
#define MAXLEN_PATH        500

/* The maximum length of a single command line argument */
#define MAXLEN_ARG         500

/* The maximum length of a text entry */
#define MAXLEN_TEXT        30000

/* We need to define a length for the error array */
#define ERROR_LENGTH = 999;

/* The maximum length of a buffer used for conversion to utf-8 */
#define MAXLEN_CONV        (MAXLEN_TEXT * 2)

/* Gaiji replacement options */
#define GAIJI_OPTION_DEFAULT    0 /* '?'                                        */
#define GAIJI_OPTION_HTML_IMG   1 /* HTML IMG tag (image is embedded as base64) */


/* The name of the subbook directory (not the full path) */
extern char subbook_directory[EB_MAX_DIRECTORY_NAME_LENGTH + 1];

/* Gaiji replacement option: GAIJI_OPTION_DEFAULT or GAIJI_OPTION_HTML_IMG */
extern int gaiji_option;


#endif /* EPLKUP_DATA_H */