import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaGithub,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 text-neutral-300 py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">MovieApp</h3>
            <p className="text-sm leading-relaxed">
              MovieApp is a platform to discover, rate, and follow your favorite
              movies and TV shows. Join our community to share your thoughts!{" "}
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="hover:text-yellow-400 transition-colors duration-300"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/movies"
                  className="hover:text-yellow-400 transition-colors duration-300"
                >
                  Movies
                </Link>
              </li>
              <li>
                <Link
                  to="/tv"
                  className="hover:text-yellow-400 transition-colors duration-300"
                >
                  TV Shows
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-yellow-400 transition-colors duration-300"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-yellow-400 transition-colors duration-300"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <FaEnvelope className="text-yellow-400" />
                <span>nvh.27304@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <FaPhone className="text-yellow-400" />
                <span>+84 792 497 018</span>
              </li>
              <li className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-yellow-400" />
                <span>HoChiMinh City</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a
                href="https://facebook.com/nvh.913"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-neutral-600 p-2 rounded-full hover:bg-yellow-400 hover:text-neutral-800 transition-colors duration-300"
              >
                <FaFacebookF size={18} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-neutral-600 p-2 rounded-full hover:bg-yellow-400 hover:text-neutral-800 transition-colors duration-300"
              >
                <FaTwitter size={18} />
              </a>
              <a
                href="https://instagram.com/nvth.3.27"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-neutral-600 p-2 rounded-full hover:bg-yellow-400 hover:text-neutral-800 transition-colors duration-300"
              >
                <FaInstagram size={18} />
              </a>
              <a
                href="https://github.com/zeldris273"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-neutral-600 p-2 rounded-full hover:bg-yellow-400 hover:text-neutral-800 transition-colors duration-300"
              >
                <FaGithub size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-600 mt-8 pt-6 text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} MovieApp. All rights reserved.
            Created by <span className="text-yellow-400">Nvh</span>.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
