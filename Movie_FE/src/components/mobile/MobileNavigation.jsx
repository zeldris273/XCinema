import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { mobileNavigation } from "../../constants/navigation";
import MobileGenresModal from "./MobileGenresModal";
import api from "../../api/api";

const MobileNavigation = () => {
  const [isGenresOpen, setIsGenresOpen] = useState(false);
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await api.get("/api/genres");
        setGenres(res.data);
      } catch (err) {
        // Error loading genres
      }
    };
    fetchGenres();
  }, []);

  const handleNavClick = (nav) => {
    if (nav.isModal) {
      setIsGenresOpen(true);
    }
  };

  return (
    <>
      <section className="lg:hidden h-14 bg-black bg-opacity-70 backdrop-blur-2xl fixed bottom-0 w-full z-40">
        <div className="flex items-center justify-around h-full text-neutral-400">
          {mobileNavigation.map((nav, index) => {
            if (nav.isModal) {
              return (
                <button
                  key={nav.label + "mobilenavigation"}
                  onClick={() => handleNavClick(nav)}
                  className="px-3 flex h-full items-center flex-col justify-center"
                >
                  <div className="text-2xl">{nav.icon}</div>
                  <p className="text-sm">{nav.label}</p>
                </button>
              );
            }

            return (
              <NavLink
                key={nav.label + "mobilenavigation"}
                to={nav.href}
                className={({ isActive }) =>
                  `px-3 flex h-full items-center flex-col justify-center ${
                    isActive && "text-white"
                  }`
                }
              >
                <div className="text-2xl">{nav.icon}</div>
                <p className="text-sm">{nav.label}</p>
              </NavLink>
            );
          })}
        </div>
      </section>

      <MobileGenresModal
        isOpen={isGenresOpen}
        onClose={() => setIsGenresOpen(false)}
        genres={genres}
      />
    </>
  );
};

export default MobileNavigation;
