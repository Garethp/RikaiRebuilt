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

#include "eplkup_font.h"
#include "eplkup_data.h"
#include "eplkup_utils.h"
#include "base64.h"


/*------------------------------------------------------------------------
-- Name: encode_character_base64
--
-- Description:
--   Convert the given character to base64 text.
--
-- Parameters:
--   (IN) book            - The book.
--   (IN) save_format     - PNG, BMP, GIF, XBM, XPM?
--   (IN) character_width - Narrow or wide?
--   (IN) character_code  - Character code to save.
--
-- Returns:
--   The base64 text. You must free() this when finished.
--   Or NULL if failed.
--
------------------------------------------------------------------------*/
char *encode_character_base64(EB_Book *book, int save_format, int character_width, int character_code)
{
  EB_Error_Code error_code;
  char image_data[EB_SIZE_FONT_IMAGE];
  unsigned char bitmap[EB_SIZE_WIDE_FONT_48];
  size_t image_size;
  int image_width;
  int image_height;

  /* Get raw bitmap data for character */
  if(character_width == SAVE_NARROW)
  {
    error_code = eb_narrow_font_character_bitmap(book, character_code, (char *)bitmap);
  }
  else
  {
    error_code = eb_wide_font_character_bitmap(book, character_code, (char *)bitmap);
  }

  /* Get height of character */
  error_code = eb_font_height(book, &image_height);

  /* Get width of character */
  if(character_width == SAVE_NARROW)
  {
    error_code = eb_narrow_font_width(book, &image_width);
  }
  else
  {
    error_code = eb_wide_font_width(book, &image_width);
  }

  /* Convert raw bitmap data to image format */
  switch(save_format)
  {
    case SAVE_GIF:
      error_code = eb_bitmap_to_gif((const char *)bitmap, image_width, image_height, image_data, &image_size);
      break;
    case SAVE_PNG:
      error_code = eb_bitmap_to_png((const char *)bitmap, image_width, image_height, image_data, &image_size);
      break;
    case SAVE_XBM:
      error_code = eb_bitmap_to_xbm((const char *)bitmap, image_width, image_height, image_data, &image_size);
      break;
    case SAVE_XPM:
      error_code = eb_bitmap_to_xpm((const char *)bitmap, image_width, image_height, image_data, &image_size);
      break;
    case SAVE_BMP:
      /* Fall-thru */
    default:
      error_code = eb_bitmap_to_bmp((const char *)bitmap, image_width, image_height, image_data, &image_size);
      break;
  }

  if(error_code == EB_SUCCESS)
  {
    /* Encode the image as base64 text */
    return encode_base64(image_size, (unsigned char*)image_data);
  }
  else
  {
    return NULL;
  }

} /* encode_character_base64 */



/*------------------------------------------------------------------------
-- Name: get_character_html_img
--
-- Description:
--   Convert the given character to an HTML IMG tag.
--
-- Parameters:
--   (OUT) dest            - Storage for the HTML IMG tag.
--   (IN)  book            - The book.
--   (IN)  save_format     - PNG, BMP, GIF, XBM, XPM?
--   (IN)  character_width - Narrow or wide?
--   (IN)  character_code  - Character code to convert.
--
-- Returns:
--   The HTML IMG tag or NULL if failed.
--
------------------------------------------------------------------------*/
char *get_character_html_img(char *dest, EB_Book *book, int save_format, int character_width, int character_code)
{
  char image_str[4] = "";
  char *base64_buf = NULL;

  dest[0] = '\0';

  /* Convert raw bitmap data to image format */
  switch(save_format)
  {
    case SAVE_GIF:
      sprintf(image_str, "gif");
      break;
    case SAVE_PNG:
      sprintf(image_str, "png");
      break;
    case SAVE_XBM:
      sprintf(image_str, "xbm");
      break;
    case SAVE_XPM:
      sprintf(image_str, "xpm");
      break;
    case SAVE_BMP:
      /* Fall-thru */
    default:
      sprintf(image_str, "bmp");
      break;
  }

  /* Get the base64 text of the code */
  base64_buf = encode_character_base64(book, save_format, character_width, character_code);

  if(base64_buf != NULL)
  {
    sprintf(dest, "<img src=\"data:image/%s;base64,%s\" alt=\"?\"/>", image_str, base64_buf);
    free(base64_buf);
  }
  else
  {
    dest = NULL;
  }

  return dest;

} /* get_character_html_img */

