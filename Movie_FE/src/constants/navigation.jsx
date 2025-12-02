import { MdHomeFilled } from "react-icons/md";
import { PiTelevisionFill } from "react-icons/pi";
import { BiSolidMoviePlay } from "react-icons/bi";
import { IoSearchOutline } from "react-icons/io5";
import { MdCategory } from "react-icons/md";

export const navigation = [
  {
    label: "TV Shows",
    href: "tv",
    icon: <PiTelevisionFill />,
  },
  {
    label: "Movies",
    href: "movies",
    icon: <BiSolidMoviePlay />,
  },
  {
    label: "Genres",
    href: "#",
    icon: <MdCategory />,
    isModal: true,
  },
  {
    label: "Watch Party",
    href: "/watch-party",
    icon: <BiSolidMoviePlay />,
  },
];

export const mobileNavigation = [
  {
    label: "Home",
    href: "/",
    icon: <MdHomeFilled />,
  },
  ...navigation,
  {
    label: "search",
    href: "/search",
    icon: <IoSearchOutline />,
  },
];
