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

#ifndef EPLKUP_FONT_H
#define EPLKUP_FONT_H

#include <eb/error.h>

#define SAVE_BMP  1
#define SAVE_GIF  2
#define SAVE_PNG  3
#define SAVE_XBM  4
#define SAVE_XPM  5

#define SAVE_NARROW  1
#define SAVE_WIDE    2

char *encode_character_base64(EB_Book *book, int save_format, int character_width, int character_code);
char *get_character_html_img(char *dest, EB_Book *book, int save_format, int character_width, int character_code);



#endif /* EPLKUP_FONT_H */