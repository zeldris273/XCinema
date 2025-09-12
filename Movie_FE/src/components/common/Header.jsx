import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import userImg from "../../assets/user.png";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { IoSearchOutline } from "react-icons/io5";
import { navigation } from "../../constants/navigation";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../../store/authSlice";
import { jwtDecode } from "jwt-decode";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  const removeSpace = location?.search?.slice(3)?.split("%20")?.join(" ");
  const [searchInput, setSearchInput] = useState(removeSpace || "");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false); // State để theo dõi hover trên desktop
  const timeoutRef = useState(null); // Ref để quản lý delay khi rời hover

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
        setIsAdmin(
          decodedToken[
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
          ] === "Admin"
        );
      } catch (error) {
        console.error("Invalid token:", error);
      }
    } else {
      setIsAdmin(false);
    }
  }, [token]);

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  const handleAuthClick = () => {
    if (!token) {
      navigate("/auth");
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
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
    if (window.innerWidth < 1024) {
      setIsUserMenuOpen(!isUserMenuOpen);
    }
  };

  const handleMouseEnter = () => {
    if (window.innerWidth >= 1024) {
      setIsHovered(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 1024) {
      timeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 300); // Delay 300ms trước khi đóng menu
    }
  };

  return (
    <header className="fixed top-0 w-full h-16 bg-black/40 bg-opacity-50 z-40">
      <div className="container mx-auto px-3 flex items-center h-full">
        <Link to="/">
          <img src={logo} alt="Logo" width={100} />
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-5">
          {navigation.map((nav, index) => (
            <div key={"Header" + index}>
              <NavLink
                key={nav.label}
                to={nav.href}
                className={({ isActive }) =>
                  `px-2 hover:text-neutral-100 ${
                    isActive ? "text-neutral-100" : "text-white"
                  }`
                }
              >
                {nav.label}
              </NavLink>
            </div>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <form
            className="flex items-center gap-2 hidden lg:flex"
            onSubmit={handleSubmit}
          >
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

          {token ? (
            <div
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className="w-8 h-8 rounded-full overflow-hidden cursor-pointer active:scale-50 transition-transform duration-200"
                onClick={toggleUserMenu}
              >
                <img
                  src={userImg}
                  alt="User"
                  className="w-full h-full object-cover bg-gray-300"
                />
              </div>
              <div
                className={`absolute top-full right-0 mt-2 w-45 bg-neutral-700 text-white rounded-md shadow-lg z-50 ${
                  window.innerWidth < 1024
                    ? isUserMenuOpen
                      ? "block"
                      : "hidden"
                    : isHovered
                    ? "block"
                    : "hidden"
                }`}
              >
                {isAdmin ? (
                  <div>
                    <button
                      onClick={handleAdminDashboard}
                      className="block w-full text-left px-4 py-2 hover:bg-neutral-600 transition-colors duration-200"
                    >
                      Admin Dashboard
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={handleWatchList}
                      className="block w-full text-left px-4 py-2 hover:bg-neutral-600 transition-colors duration-200"
                    >
                      Watch List
                    </button>
                    <button
                      onClick={handleUserProfile}
                      className="block w-full text-left px-4 py-2 hover:bg-neutral-600 transition-colors duration-200"
                    >
                      Profile
                    </button>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 hover:bg-neutral-600 transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleAuthClick}
              className="text-white hover:text-gray-300 transition-colors duration-200"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
