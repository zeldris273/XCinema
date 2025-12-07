import { useEffect, useState, useRef } from "react";
import logo from "../../assets/logo.png";
import userImg from "../../assets/user.png";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { IoSearchOutline } from "react-icons/io5";
import { navigation } from "../../constants/navigation";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../../store/authSlice";
import { jwtDecode } from "jwt-decode";
import { useUserProfile } from "../../hooks/useUserProfile";
import { FiLogOut } from "react-icons/fi";
import api from "../../api/api";
import AuthModal from "../../components/common/AuthModal";
import NotificationDropdown from "../../components/common/NotificationDropdown";
import customToast from "../../utils/customToast";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showAuthModal, setShowAuthModal] = useState(false);

  const { token } = useSelector((state) => state.auth);
  const { profile } = useUserProfile();

  const removeSpace = location?.search?.slice(3)?.split("%20")?.join(" ");
  const [searchInput, setSearchInput] = useState(removeSpace || "");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [genres, setGenres] = useState([]);
  const [isGenreOpen, setIsGenreOpen] = useState(false);

  const timeoutRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!location.pathname.startsWith("/search")) {
      setSearchInput("");
    } else {
      const query = location?.search?.slice(3)?.split("%20")?.join(" ") || "";
      setSearchInput(query);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (searchInput) {
      navigate(`/search?q=${searchInput}`);
    }
  }, [searchInput, navigate]);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setIsAdmin(decodedToken["role"] === "Admin");
      } catch (error) {
        // Invalid token
      }
    } else {
      setIsAdmin(false);
    }
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await api.get("/api/genres/dropdown");
        setGenres(res.data);
      } catch (err) {
        // Error loading genres
      }
    };
    fetchGenres();
  }, []);

  const handleGenreEnter = () => setIsGenreOpen(true);
  const handleGenreLeave = () => setIsGenreOpen(false);

  const handleAuthClick = () => {
    if (!token) {
      // Lưu URL hiện tại để redirect về sau khi đăng nhập
      const currentPath = location.pathname + location.search;
      localStorage.setItem("loginRedirect", currentPath);
      setShowAuthModal(true);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    customToast("Logout Successful", "success");
    navigate("/");
    setIsUserMenuOpen(false);
    setIsHovered(false);
  };

  const handleWatchList = () => {
    navigate("/user/watchlist");
    setIsUserMenuOpen(false);
    setIsHovered(false);
  };

  const handleAdminDashboard = () => {
    navigate("/admin-dashboard");
    setIsUserMenuOpen(false);
    setIsHovered(false);
  };

  const handleUserProfile = () => {
    navigate("/user/profile");
    setIsUserMenuOpen(false);
    setIsHovered(false);
  };

  const toggleUserMenu = () => {
    if (window.innerWidth < 1024) setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleMouseEnter = () => {
    if (window.innerWidth >= 1024) {
      setIsHovered(true);
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 1024) {
      timeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 300);
    }
  };

  return (
    <>
      <header className="fixed top-0 w-full h-16 bg-black/40 bg-opacity-50 z-40">
        <div className="container mx-auto px-3 flex items-center h-full">
          <Link to="/">
            <img src={logo} alt="Logo" width={100} />
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-5">
            {navigation.map((nav, index) => (
              <div key={index} className="relative">
                {nav.label === "Genres" ? (
                  <div
                    onMouseEnter={handleGenreEnter}
                    onMouseLeave={handleGenreLeave}
                  >
                    <span className="px-2 text-white cursor-pointer hover:text-neutral-100">
                      {nav.label}
                    </span>

                    {isGenreOpen && (
                      <div className="absolute top-full left-0 pt-2 z-50">
                        <div className="w-56 max-h-[400px] overflow-y-auto bg-neutral-800 border border-neutral-700 rounded-md shadow-lg custom-scrollbar">
                          {genres.map((g) => (
                            <Link
                              key={g.id}
                              to={`/genres/${g.id}`}
                              className="block px-4 py-2 text-sm text-gray-200 hover:bg-neutral-700 hover:text-white"
                              onClick={() => setIsGenreOpen(false)}
                            >
                              {g.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={nav.href}
                    className={({ isActive }) =>
                      `px-2 hover:text-neutral-100 ${
                        isActive ? "text-neutral-100" : "text-white"
                      }`
                    }
                  >
                    {nav.label}
                  </NavLink>
                )}
              </div>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {/* SEARCH */}
            <form className="hidden lg:flex items-center gap-2">
              <input
                type="text"
                placeholder="Search here..."
                className="bg-transparent px-3 py-1 outline-none border-none text-white placeholder-gray-400"
                onChange={(e) => setSearchInput(e.target.value)}
                value={searchInput}
              />
              <button className="text-2xl text-white">
                <IoSearchOutline />
              </button>
            </form>

            {/* APP DOWNLOAD */}
            <a
              href="/downloads/xcinema.apk"
              download
              className="flex items-center gap-3 px-3 py-2"
            >
              <svg
                id="Pc"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10.9998 16.8992C11.1655 16.8992 11.2998 16.7649 11.2998 16.5992V11.5982C11.2998 9.28322 13.1838 7.39922 15.4998 7.39922H18.7998C18.9238 7.39922 19.0446 7.41106 19.1616 7.43327C19.3745 7.47368 19.5998 7.32682 19.5998 7.11012V6.69922C19.5998 6.67022 19.5968 6.64022 19.5918 6.61222C19.2488 4.66722 17.4468 3.19922 15.4008 3.19922H6.79982C4.42882 3.19922 2.49982 5.12822 2.49982 7.49922V12.5982C2.49982 14.9692 4.42882 16.8992 6.79982 16.8992H8.24282L7.86182 19.2492H5.85982C5.44582 19.2492 5.10982 19.5852 5.10982 19.9992C5.10982 20.4132 5.44582 20.7492 5.85982 20.7492H10.7598C11.1738 20.7492 11.5098 20.4132 11.5098 19.9992C11.5098 19.5852 11.1738 19.2492 10.7598 19.2492H9.38082L9.76182 16.8992H10.9998Z"
                  fill="yellow"
                ></path>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M17.1912 18.4564C16.7712 18.4564 16.4302 18.1154 16.4302 17.6954C16.4302 17.2754 16.7712 16.9344 17.1912 16.9344C17.6112 16.9344 17.9522 17.2754 17.9522 17.6954C17.9522 18.1154 17.6112 18.4564 17.1912 18.4564ZM18.8002 8.90039H15.5002C14.0362 8.90039 12.8002 10.1364 12.8002 11.5994V18.0994C12.8002 19.5884 14.0112 20.7994 15.5002 20.7994H18.8002C20.2892 20.7994 21.5002 19.5884 21.5002 18.0994V11.5994C21.5002 10.1364 20.2642 8.90039 18.8002 8.90039Z"
                  fill="#ffffff"
                ></path>
              </svg>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] text-white">Tải ứng dụng</span>
                <span className="font-semibold text-white text-[12px]">
                  XCinema
                </span>
              </div>
            </a>

            {/* Notification Dropdown */}
            <NotificationDropdown />

            {token ? (
              <div className="relative">
                {/* AVATAR */}
                <div
                  className="w-8 h-8 rounded-full overflow-hidden cursor-pointer"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                >
                  <img
                    src={profile?.avatarUrl || userImg}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* USER DROPDOWN */}
                {isUserMenuOpen && (
                  <div
                    ref={userMenuRef}
                    className="absolute top-full right-0 mt-2 w-45 bg-neutral-700 text-white rounded-md shadow-lg z-50"
                  >
                    {isAdmin ? (
                      <button
                        onClick={handleAdminDashboard}
                        className="block w-full text-left px-4 py-2 hover:bg-neutral-600"
                      >
                        Admin Dashboard
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleWatchList}
                          className="block w-full text-left px-4 py-2 hover:bg-neutral-600"
                        >
                          Watch List
                        </button>
                        <button
                          onClick={handleUserProfile}
                          className="block w-full text-left px-4 py-2 hover:bg-neutral-600"
                        >
                          Profile
                        </button>
                      </>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 hover:bg-neutral-600 text-red-400"
                    >
                      <FiLogOut className="mr-1" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleAuthClick}
                className="text-white hover:text-gray-300"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <AuthModal
          show={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
};

export default Header;
