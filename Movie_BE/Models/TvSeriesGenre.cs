using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Models;

namespace Movie_BE.Models
{
    public class TvSeriesGenre
    {
        public int TvSeriesId { get; set; }
        public TvSeries TvSeries { get; set; }

        public int GenreId { get; set; }
        public Genre Genre { get; set; }
    }
}