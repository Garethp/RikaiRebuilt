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

#ifndef EPLKUP_UTILS_H
#define EPLKUP_UTILS_H

#define MAX(x, y) (((x) > (y)) ? (x) : (y))
#define MIN(x, y) (((x) < (y)) ? (x) : (y))

int is_hex(char c);
int str_eq_i(const char *a, const char *b);
char *strncpy_len(char *dst, char *src, int len);
char *convert_encoding(char *dest, int max_dest, char *src, int max_src, const char *dest_enc, const char *src_enc);

#endif /* EPLKUP_UTILS_H */