using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Models;

namespace Movie_BE.Models
{
    public class MovieGenre
    {
        public int MovieId { get; set; }
        public Movie Movie { get; set; }

        public int GenreId { get; set; }
        public Genre Genre { get; set; }
    }
}