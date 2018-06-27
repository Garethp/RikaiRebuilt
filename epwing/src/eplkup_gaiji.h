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

#ifndef EPLKUP_GAIJI_H
#define EPLKUP_GAIJI_H


#define MAX_BYTES_UTF8_REPLACEMENT  9

typedef struct
{
  /* Gaiji code. Example: 0xA23D. */ 
  unsigned short code;                         

  /* Number of bytes that make up the UTF-8 replacement */
  char num_bytes;                               

  /* The replacement bytes representing one or more UTF-8 characters. 
     Worst case: 3 UTF-8 characters
     Best case:  9 UTF-8 characters */ 
  char replacement[MAX_BYTES_UTF8_REPLACEMENT]; 

} Gaiji_table_type;



int is_gaiji_width_char(char c);
void get_gaiji_table(const char *dic_name, char width, Gaiji_table_type **gaiji_table, int *max_elem);
int compare_gaiji (const void *key, const void *elem);
Gaiji_table_type * get_gaiji_replacment_elem(const char *dic_name, char width, unsigned short code);
char * get_gaiji_replacement_text(char *dest, const char *dic_name, char width, char c1, char c2, char c3, char c4);
char * replace_gaiji_with_utf8(char *dest, char *src);


/*
  Gaiji Tables
*/

/* CHUJITEN (研究社　新英和・和英中辞典) */
#define NUM_NARROW_CHUJITEN_ITEMS  161
#define NUM_WIDE_CHUJITEN_ITEMS    5
extern Gaiji_table_type gaiji_table_narrow_chujiten[NUM_NARROW_CHUJITEN_ITEMS];
extern Gaiji_table_type gaiji_table_wide_chujiten[NUM_WIDE_CHUJITEN_ITEMS];

/* DAIJIRIN (大辞林 第2版) */
#define NUM_NARROW_DAIJIRIN_ITEMS  153
#define NUM_WIDE_DAIJIRIN_ITEMS    1234
extern Gaiji_table_type gaiji_table_narrow_daijirin[NUM_NARROW_DAIJIRIN_ITEMS];
extern Gaiji_table_type gaiji_table_wide_daijirin[NUM_WIDE_DAIJIRIN_ITEMS];

/* DAIJISEN (大辞泉) */
#define NUM_NARROW_DAIJISEN_ITEMS  227
#define NUM_WIDE_DAIJISEN_ITEMS    73
extern Gaiji_table_type gaiji_table_narrow_daijisen[NUM_NARROW_DAIJISEN_ITEMS];
extern Gaiji_table_type gaiji_table_wide_daijisen[NUM_WIDE_DAIJISEN_ITEMS];

/* GENIUS (genius revised edition - ジーニアス英和辞典〈改訂版〉) */
#define NUM_NARROW_GENIUS_ITEMS  101
#define NUM_WIDE_GENIUS_ITEMS    52
extern Gaiji_table_type gaiji_table_narrow_genius[NUM_NARROW_GENIUS_ITEMS];
extern Gaiji_table_type gaiji_table_wide_genius[NUM_WIDE_GENIUS_ITEMS];

/* MEIKYOU - (what is this?) */
#define NUM_NARROW_MEIKYOU_ITEMS  22
#define NUM_WIDE_MEIKYOU_ITEMS    529
extern Gaiji_table_type gaiji_table_narrow_meikyou[NUM_NARROW_MEIKYOU_ITEMS];
extern Gaiji_table_type gaiji_table_wide_meikyou[NUM_WIDE_MEIKYOU_ITEMS];

/* MEIKYOJJ (明鏡国語辞典) */
#define NUM_NARROW_MEIKYOJJ_ITEMS  5
#define NUM_WIDE_MEIKYOJJ_ITEMS    49
extern Gaiji_table_type gaiji_table_narrow_meikyojj[NUM_NARROW_MEIKYOJJ_ITEMS];
extern Gaiji_table_type gaiji_table_wide_meikyojj[NUM_WIDE_MEIKYOJJ_ITEMS];

/* WADAI5 (研究社　新和英大辞典　第５版) */
#define NUM_NARROW_WADAI5_ITEMS  382
#define NUM_WIDE_WADAI5_ITEMS    26
extern Gaiji_table_type gaiji_table_narrow_wadai5[NUM_NARROW_WADAI5_ITEMS];
extern Gaiji_table_type gaiji_table_wide_wadai5[NUM_WIDE_WADAI5_ITEMS];

/* KOJIEN (広辞苑第六版) */
#define NUM_NARROW_KOJIEN_ITEMS  147
#define NUM_WIDE_KOJIEN_ITEMS    1568
extern Gaiji_table_type gaiji_table_narrow_kojien[NUM_NARROW_KOJIEN_ITEMS];
extern Gaiji_table_type gaiji_table_wide_kojien[NUM_WIDE_KOJIEN_ITEMS];

/* SNMKG99 (新明解国語辞典　第五版) */
#define NUM_NARROW_SNMKG99_ITEMS  0
#define NUM_WIDE_SNMKG99_ITEMS    4
//extern Gaiji_table_type gaiji_table_narrow_snmkg99[NUM_NARROW_SNMKG99_ITEMS];
extern Gaiji_table_type gaiji_table_wide_snmkg99[NUM_WIDE_SNMKG99_ITEMS];

#endif /* EPLKUP_GAIJI_H */