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

#include <stdlib.h>
#include <string.h>

#include "eplkup_gaiji.h"
#include "eplkup_utils.h"
#include "eplkup_data.h"


/*------------------------------------------------------------------------
-- Name: is_gaiji_width_char
--
-- Description:
--   Does the provided character represent a gaiji width (narrow/wide)?
--
-- Parameters:
--   (IN) c - The character to check.
--
-- Returns:
--   0 = Character is not a gaiji width character.
--   1 = Character is a gaiji width character.
--
------------------------------------------------------------------------*/
int is_gaiji_width_char(char c)
{
   return ((c == 'n') || (c == 'w'));

} /* is_gaiji_width_char */


/*------------------------------------------------------------------------
-- Name: get_gaiji_table
--
-- Description:
--   Get the appropriate gaiji table based on the dictionary name and
--   gaiji width (narrow/wide).
--
-- Parameters:
--   (IN)  dic_name    - Name of the dictionary.
--   (IN)  width       - Gaiji width. 'n' = narrow. 'w' = wide.
--   (OUT) gaiji_table - Pointer to the found table. NULL if table not found.
--   (OUT) max_elem    - Number of elements in the table. NULL if table not found.
--
-- Returns:
--   None.
--
------------------------------------------------------------------------*/
void get_gaiji_table(const char *dic_name, char width, Gaiji_table_type **gaiji_table, int *max_elem)
{
  if(str_eq_i(dic_name, "wadai5"))
  {
    if(width == 'n')
    {
      *gaiji_table = gaiji_table_narrow_wadai5;
      *max_elem = NUM_NARROW_WADAI5_ITEMS;
    }
    else
    {
      *gaiji_table = gaiji_table_wide_wadai5;
      *max_elem = NUM_WIDE_WADAI5_ITEMS;
    }
  }
  else if(str_eq_i(dic_name, "kojien"))
  {
    if(width == 'n')
    {
      *gaiji_table = gaiji_table_narrow_kojien;
      *max_elem = NUM_NARROW_KOJIEN_ITEMS;
    }
    else
    {
      *gaiji_table = gaiji_table_wide_kojien;
      *max_elem = NUM_WIDE_KOJIEN_ITEMS;
    }
  }
  else if(str_eq_i(dic_name, "chujiten"))
  {
    if(width == 'n')
    {
      *gaiji_table = gaiji_table_narrow_chujiten;
      *max_elem = NUM_NARROW_CHUJITEN_ITEMS;
    }
    else
    {
      *gaiji_table = gaiji_table_wide_chujiten;
      *max_elem = NUM_WIDE_CHUJITEN_ITEMS;
    }
  }
  else if(str_eq_i(dic_name, "genius"))
  {
    if(width == 'n')
    {
      *gaiji_table = gaiji_table_narrow_genius;
      *max_elem = NUM_NARROW_GENIUS_ITEMS;
    }
    else
    {
      *gaiji_table = gaiji_table_wide_genius;
      *max_elem = NUM_WIDE_GENIUS_ITEMS;
    }
  }
  else if(str_eq_i(dic_name, "daijirin"))
  {
    if(width == 'n')
    {
      *gaiji_table = gaiji_table_narrow_daijirin;
      *max_elem = NUM_NARROW_DAIJIRIN_ITEMS;
    }
    else
    {
      *gaiji_table = gaiji_table_wide_daijirin;
      *max_elem = NUM_WIDE_DAIJIRIN_ITEMS;
    }
  }
  else if(str_eq_i(dic_name, "meikyou"))
  {
    if(width == 'n')
    {
      *gaiji_table = gaiji_table_narrow_meikyou;
      *max_elem = NUM_NARROW_MEIKYOU_ITEMS;
    }
    else
    {
      *gaiji_table = gaiji_table_wide_meikyou;
      *max_elem = NUM_WIDE_MEIKYOU_ITEMS;
    }
  }
  else if(str_eq_i(dic_name, "meikyojj"))
  {
    if(width == 'n')
    {
      *gaiji_table = gaiji_table_narrow_meikyojj;
      *max_elem = NUM_NARROW_MEIKYOJJ_ITEMS;
    }
    else
    {
      *gaiji_table = gaiji_table_wide_meikyojj;
      *max_elem = NUM_WIDE_MEIKYOJJ_ITEMS;
    }
  }
  else if(str_eq_i(dic_name, "daijisen"))
  {
    if(width == 'n')
    {
      *gaiji_table = gaiji_table_narrow_daijisen;
      *max_elem = NUM_NARROW_DAIJISEN_ITEMS;
    }
    else
    {
      *gaiji_table = gaiji_table_wide_daijisen;
      *max_elem = NUM_WIDE_DAIJISEN_ITEMS;
    }
  }
  else if(str_eq_i(dic_name, "snmkg99"))
  {
    if(width == 'n')
    {
      *gaiji_table = NULL;
      //*gaiji_table = gaiji_table_narrow_snmkg99;
      *max_elem = NUM_NARROW_SNMKG99_ITEMS;
    }
    else
    {
      *gaiji_table = gaiji_table_wide_snmkg99;
      *max_elem = NUM_WIDE_SNMKG99_ITEMS;
    }
  }
  else
  {
     *gaiji_table = NULL;
  }

} /* get_gaiji_table */


/*------------------------------------------------------------------------
-- Name: compare_gaiji
--
-- Description:
--   Comparison routine for the binary search in get_gaiji_replacment_elem.
--
-- Parameters:
--   (IN) key  - The item we are searching for.
--   (IN) elem - The element of the array we are searching in.
--
-- Returns:
--   <0: key < elem
--   =0: key == elem
--   >0: key > elem
--
------------------------------------------------------------------------*/
int compare_gaiji (const void *key, const void *elem)
{
  return *(unsigned short*)key - (unsigned short)((Gaiji_table_type*)elem)->code;

} /* compare_gaiji */


/*------------------------------------------------------------------------
-- Name: get_gaiji_replacment_elem
--
-- Description:
--   Get the gaiji table element for the given gaiji code and dictionary.
--
-- Parameters:
--   (IN)  dic_name - Name of the dictionary
--   (IN)  width    - Character representing the width of the gaiji.
--                    'n' = narrow. 'w' = wide.
--   (IN)  code     - The gaiji code.
--
-- Returns:
--   The gaiji table element or NULL if element could not be found.
--
------------------------------------------------------------------------*/
Gaiji_table_type * get_gaiji_replacment_elem(const char *dic_name, char width, unsigned short code)
{
  int max_elem = 0;
  Gaiji_table_type *gaiji_elem = NULL;
  Gaiji_table_type *gaiji_table = NULL;

  /* Get the gaiji table to use */
  get_gaiji_table(dic_name, width, &gaiji_table, &max_elem);

  /* Was an appropriate gaiji table found? If so, find the particular gaiji replacement to use. */
  if(gaiji_table != NULL)
  {    
    gaiji_elem = (Gaiji_table_type *)bsearch(&code, gaiji_table, max_elem, sizeof(Gaiji_table_type), compare_gaiji);
  }

  return gaiji_elem;

} /* get_gaiji_replacment_elem */


/*------------------------------------------------------------------------
-- Name: get_gaiji_replacement_text
--
-- Description:
--   Get the UTF-8 gaiji replacement text for the given gaiji code and dictionary.
--
-- Parameters:
--   (OUT) dest     - Storage for the gaiji replacement text. Must be
--                    at least MAX_BYTES_UTF8_REPLACEMENT + 1 bytes.
--   (IN)  dic_name - Name of the dictionary
--   (IN)  width    - Character representing the width of the gaiji.
--                    'n' = narrow. 'w' = wide.
--   (IN)  c1       - 1st character of the gaiji code.
--   (IN)  c2       - 2nd character of the gaiji code.
--   (IN)  c3       - 3rd character of the gaiji code.
--   (IN)  c4       - 4th character of the gaiji code.
--
-- Returns:
--   The gaiji replacement text.
--
------------------------------------------------------------------------*/
char * get_gaiji_replacement_text(char *dest, const char *dic_name, char width, char c1, char c2, char c3, char c4)
{
  int i = 0;
  Gaiji_table_type *gaiji = NULL;
  char hex_str[4] = { c1, c2, c3, c4 };
  unsigned short code = (unsigned short)strtoul(hex_str, NULL, 16);

  /* Get the element from the appropriate gaiji table to use */
  gaiji = get_gaiji_replacment_elem(dic_name, width, code);

  /* Was a gaiji replacement found? If so, copy the replacement into dest. */
  if(gaiji != NULL)
  {
    for(i = 0; i < gaiji->num_bytes; i++)
    {
      dest[i] = gaiji->replacement[i];
    }

    dest[i] = '\0';
  }
  else
  {
    /* If the gaiji replacement could not be found, default to "?" */
    dest[0] = '?';
    dest[1] = '\0';
  }

  return dest;

} /* get_gaiji_replacement_text */


/*------------------------------------------------------------------------
-- Name: replace_gaiji_with_utf8
--
-- Description:
--   Replace all gaiji that have UTF-8 equivalents with those equivalents.
--
--   The gaiji in the source string should be replresented as follows:
--   {#[w or n][hex_gaiji_code]x4} (use this printf format: {#n%04X} or {#w%04X})
--
-- Parameters:
--   (OUT) dest - Storage for the replaced text.
--   (IN)  src  - The source text that contains the gaiji codes to replace.
--
-- Returns:
--   The replaced text.
--
------------------------------------------------------------------------*/
char * replace_gaiji_with_utf8(char *dest, char *src)
{
  int i = 0;
  int dest_idx = 0;
  int src_len = strlen(src);
  char replacement[MAX_BYTES_UTF8_REPLACEMENT + 1]; /* Storage for the replacement character(s) */
  
  dest[0] = '\0';
 
  for(i = 0; i < src_len; i++)
  {
    /* Is a gaiji code encountered? */
    if(((i + 7 < src_len) && src[i] == '{') && (src[i + 1] == '#') && is_gaiji_width_char(src[i + 2]) 
      && is_hex(src[i + 3]) && is_hex(src[i + 4]) && is_hex(src[i + 5]) && is_hex(src[i + 6]) && (src[i + 7] == '}'))
    {
       /* Get the replacement character(s) for the gaiji code */
       get_gaiji_replacement_text(replacement, subbook_directory, src[i + 2], src[i + 3], src[i + 4], src[i + 5], src[i + 6]);

       /* Add the replacement character(s) to dest */
       dest[dest_idx] = '\0';
       strcat(dest, replacement);
       dest_idx += strlen(replacement);
       i += 7;
    }
    else /* No gaiji code encountered */
    {
      dest[dest_idx++] = src[i];
    }
  }

  dest[dest_idx] = '\0';

  return dest;

} /* replace_gaiji_with_utf8 */