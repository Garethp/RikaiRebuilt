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
#include <ctype.h>
#include <errno.h>

#include "string.h"
#include "iconv.h"
#include "eplkup_utils.h"


/*------------------------------------------------------------------------
-- Name: is_hex
--
-- Description:
--   Is the provided character a hex character?
--
-- Parameters:
--   (IN) c - The character to check.
--
-- Returns:
--   0 = Character is not a hex character.
--   1 = Character is a hex character.
--
------------------------------------------------------------------------*/
int is_hex(char c)
{
  return (((c >= '0') && (c <= '9')) || ((c >= 'A') && (c <= 'F')) || ((c >= 'a') && (c <= 'f')));

} /* is_hex */


/*------------------------------------------------------------------------
-- Name: str_eq_i
--
-- Description:
--   Determine if 2 strings are equal (case insentive)
--
-- Parameters:
--   (IN) a - The first string to compare.
--   (IN) b - The second string to compare.
--
-- Returns:
--   0 = Strings are not equal.
--   1 = Strings are equal.
--
------------------------------------------------------------------------*/
int str_eq_i(const char *a, const char *b)
{
  int i = 0;
  int equal = 1;
  int len_a = strlen(a);
  int len_b = strlen(b);

  if(len_a == len_b)
  {
    for(i = 0; i < len_a; i++)
    {
      if(tolower(a[i]) != tolower(b[i]))
      {
        equal = 0;
        break;
      }
    }
  }
  else
  {
    equal = 0;
  }

  return equal;

}  /* str_eq_i */


/*------------------------------------------------------------------------
-- Name: strncpy_len
--
-- Description:
--   Copy the specified number of characters from one buffer to another.
--
-- Parameters:
--   (OUT) dst - The destination buffer.
--   (IN)  src - The source buffer.
--   (IN)  len - The number of characters to copy (includes null terminator).
--
-- Returns:
--   The destination buffer.
--
------------------------------------------------------------------------*/
char *strncpy_len(char *dst, char *src, int len)
{
  dst[0] = '\0';
  strncat(dst, src, len);

  return dst;

} /* strncpy_len */


/*------------------------------------------------------------------------
-- Name: convert_encoding
--
-- Description:
--   Convert string from one encoding to another encoding.
--
-- Parameters:
--   (OUT)     dest     - Destination string in the desired encoding.
--   (IN)      max_dest - Maximum length of the destination string.
--   (IN/OUT)  src      - Source string in the original encoding.
--   (IN)      max_src  - Length of the source string.
--   (IN)      dest_enc - The encoding of the "dest" string. Possible
--                        encodings: http://www.gnu.org/software/libiconv/
--   (IN)      src_enc  - The encoding of the "src" string.
--
-- Returns:
--   Destination string in the desired encoding.
--
------------------------------------------------------------------------*/
char *convert_encoding(char *dest, int max_dest, char *src, int max_src, const char *dest_enc, const char *src_enc)
{
  iconv_t cd;
  size_t in_left = max_src;
  char *out_buf = dest;
  size_t out_left = max_dest;
  size_t status_conv = 0;

  cd = iconv_open(dest_enc, src_enc);

  if(cd == (iconv_t)-1)
  {
    if(errno == EINVAL)
    {
      fprintf(stderr, "Error: Conversion from '%s' to '%s' not available.", src_enc, dest_enc);
    }
    else
    {
      fprintf(stderr, "Error: An unknown error occured with iconv_open.");
    }

    return NULL;
  }

  status_conv = iconv(cd, &src, &in_left, &out_buf, &out_left);

  if(status_conv == (size_t)-1)
  {
    if(errno == EINVAL)
    {
      fprintf(stderr, "Warning: An incomplete multibyte sequence has been encountered in the input.");
    }
    else if(errno == E2BIG)
    {
      fprintf(stderr, "Error: dest is too small.");
      return NULL;
    }
    else if(errno == EILSEQ)
    {
      fprintf(stderr, "Error: An invalid multibyte sequence has been encountered in the input.");
      return NULL;
    }
  }

  dest[max_dest - out_left] = '\0';

  if(iconv_close(cd) != 0)
  {
    fprintf(stderr, "Warning: An unknown error occured with iconv_close.");
  }

  return dest;

} /* convert_encoding */
