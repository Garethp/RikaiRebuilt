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


#ifndef EPLKUP_HOOK_HANDLER_H
#define EPLKUP_HOOK_HANDLER_H


/* Reference: hooks and the routines that go with them
{ EB_HOOK_BEGIN_CANDIDATE      , hook_set_begin_candidate      },
{ EB_HOOK_BEGIN_COLOR_BMP      , hook_set_begin_color_bmp      },
{ EB_HOOK_BEGIN_COLOR_JPEG     , hook_set_begin_color_jpeg     },
{ EB_HOOK_BEGIN_DECORATION     , hook_set_begin_decoration     },
{ EB_HOOK_BEGIN_EMPHASIS       , hook_set_begin_emphasis       },
{ EB_HOOK_BEGIN_GRAY_GRAPHIC   , hook_set_begin_gray_graphic   },
{ EB_HOOK_BEGIN_IN_COLOR_BMP   , hook_set_begin_in_color_bmp   },
{ EB_HOOK_BEGIN_IN_COLOR_JPEG  , hook_set_begin_in_color_jpeg  },
{ EB_HOOK_BEGIN_KEYWORD        , hook_set_begin_keyword        },
{ EB_HOOK_BEGIN_MONO_GRAPHIC   , hook_set_begin_mono_graphic   },
{ EB_HOOK_BEGIN_MPEG           , hook_set_begin_mpeg           },
{ EB_HOOK_BEGIN_NARROW         , hook_set_begin_narrow         },
{ EB_HOOK_BEGIN_NO_NEWLINE     , hook_set_begin_no_newline     },
{ EB_HOOK_BEGIN_REFERENCE      , hook_set_begin_reference      },
{ EB_HOOK_BEGIN_SUBSCRIPT      , hook_set_begin_subscript      },
{ EB_HOOK_BEGIN_SUPERSCRIPT    , hook_set_begin_superscript    },
{ EB_HOOK_BEGIN_WAVE           , hook_set_begin_wave           },
{ EB_HOOK_END_CANDIDATE_GROUP  , hook_set_end_candidate_group  },
{ EB_HOOK_END_CANDIDATE_LEAF   , hook_set_end_candidate_leaf   },
{ EB_HOOK_END_COLOR_GRAPHIC    , hook_set_end_color_graphic    },
{ EB_HOOK_END_DECORATION       , hook_set_end_decoration       },
{ EB_HOOK_END_EMPHASIS         , hook_set_end_emphasis         },
{ EB_HOOK_END_GRAY_GRAPHIC     , hook_set_end_gray_graphic     },
{ EB_HOOK_END_IN_COLOR_GRAPHIC , hook_set_end_in_color_graphic },
{ EB_HOOK_END_KEYWORD          , hook_set_end_keyword          },
{ EB_HOOK_END_MONO_GRAPHIC     , hook_set_end_mono_graphic     },
{ EB_HOOK_END_MPEG             , hook_set_end_mpeg             },
{ EB_HOOK_END_NARROW           , hook_set_end_narrow           },
{ EB_HOOK_END_NO_NEWLINE       , hook_set_end_no_newline       },
{ EB_HOOK_END_REFERENCE        , hook_set_end_reference        },
{ EB_HOOK_END_SUBSCRIPT        , hook_set_end_subscript        },
{ EB_HOOK_END_SUPERSCRIPT      , hook_set_end_superscript      },
{ EB_HOOK_END_WAVE             , hook_set_end_wave             },
{ EB_HOOK_GB2312               , hook_set_gb2312               },
{ EB_HOOK_ISO8859_1            , hook_set_iso8859_1            },
{ EB_HOOK_NARROW_FONT          , hook_set_narrow_font          },
{ EB_HOOK_NARROW_JISX0208      , hook_set_narrow_jisx0208      },
{ EB_HOOK_NEWLINE              , hook_set_newline              },
{ EB_HOOK_SET_INDENT           , hook_set_indent               },
{ EB_HOOK_WIDE_FONT            , hook_set_wide_font            },
{ EB_HOOK_WIDE_JISX0208        , hook_set_wide_jisx0208        },
{ EB_HOOK_NULL                 , hook_set_null                 }, 
*/


EB_Error_Code hook_set_begin_candidate(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_begin_color_bmp(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_begin_color_jpeg(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_begin_decoration(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_begin_emphasis(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_begin_gray_graphic(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_begin_in_color_bmp(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_begin_in_color_jpeg(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_begin_keyword(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_begin_mono_graphic(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_begin_mpeg(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_begin_narrow(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_begin_no_newline(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_begin_reference(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_begin_subscript(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_begin_superscript(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_begin_wave(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_end_candidate_group(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_end_candidate_leaf(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_end_color_graphic(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_end_decoration(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_end_emphasis(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_end_gray_graphic(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_end_in_color_graphic(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_end_keyword(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_end_mono_graphic(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_end_mpeg(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_end_narrow(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_end_no_newline(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_end_reference(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_end_subscript(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_end_superscript(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_end_wave(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_gb2312(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_iso8859_1(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_narrow_font(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_narrow_jisx0208(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_newline(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_null(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_indent(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_wide_font(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

EB_Error_Code hook_set_wide_jisx0208(EB_Book *book, EB_Appendix *appendix, void *container,
  EB_Hook_Code code, int argc, const unsigned int *argv);

#endif /* EPLKUP_HOOK_HANDLER_H */