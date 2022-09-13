import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { HiMenuAlt4 } from "react-icons/hi";
import { AiOutlineClose, AiFillPlayCircle } from "react-icons/ai";
import { FaStar } from "react-icons/fa";
import { PlatformContext } from "../context/PlatformContext";
import Wallet from "./Wallet";
import { login, logout as destroy } from "../utils/near";

const NavBarItem = ({ title, classprops }) => (
  <li className={`mx-4 cursor-pointer ${classprops}`}>{title}</li>
);

const Navbar = () => {
  const { balance, fetchedRating } =
    useContext(PlatformContext);
  const account = window.walletConnection.account();

  const [toggleMenu, setToggleMenu] = React.useState(false);

  const renderNotConnectedContainer = () => (
    <button
      type="button"
      onClick={login}
      className="flex flex-row justify-center items-center my-5 bg-[#2952e3] p-3 rounded-full cursor-pointer hover:bg-[#2546bd]"
    >
      <AiFillPlayCircle className="text-white mr-2" />
      <p className="text-white text-base font-semibold">Connect Wallet</p>
    </button>
  );

  const renderAccountInfo = () => (
    <div className="flex flex-row">
      <span className="mr-1 self-center">
        My rating:
      </span>
      <span className="flex flex-row justify-center items-center mr-4">
        {fetchedRating === 0
          ? "unrated"
          : [...Array(fetchedRating)].map((star, index) => (
            <FaStar key={index} color="#ffc107" size={20} />
          ))}
      </span>
      <Wallet
        address={account.accountId}
        amount={balance}
        symbol="NEAR"
        destroy={destroy}
      />
    </div>
  );

  return (
    <nav className="w-full flex md:justify-center justify-between items-center p-4">
      <div className="md:flex-[0.5] flex-initial justify-center items-center">
        <Link to="/">
          <p className="text-white text-2xl cursor-pointer">
            <span className="text-[#d946ef]">Me</span>Pay
          </p>
        </Link>
      </div>
      <ul className="text-white md:flex hidden list-none flex-row justify-between items-center flex-initial">
        {account.accountId ? (
          <div className="flex flex-row">
            <Link to="/new">
              <NavBarItem title="Add Task" />
            </Link>
            <Link to="/mytasks">
              <NavBarItem title="My Tasks" />
            </Link>
          </div>
        ) : (
          <li />
        )}
        <li>
          {!account.accountId && renderNotConnectedContainer()}
          {account.accountId && renderAccountInfo()}
        </li>
      </ul>
      <div className="flex relative">
        {!toggleMenu && (
          <HiMenuAlt4
            fontSize={28}
            className="text-white md:hidden cursor-pointer"
            onClick={() => setToggleMenu(true)}
          />
        )}
        {toggleMenu && (
          <AiOutlineClose
            fontSize={28}
            className="text-white md:hidden cursor-pointer"
            onClick={() => setToggleMenu(false)}
          />
        )}
        {toggleMenu && (
          <ul
            className="z-10 fixed -top-0 -right-2 p-3 w-[70vw] h-screen shadow-2xl md:hidden list-none
            flex flex-col justify-start items-end rounded-md blue-glassmorphism text-white animate-slide-in"
          >
            <li className="text-xl w-full my-2">
              <AiOutlineClose onClick={() => setToggleMenu(false)} />
            </li>
            <li>
              {!account.accountId && renderNotConnectedContainer()}
              {account.accountId && renderAccountInfo()}
            </li>
            {account.accountId ? (
              <>
                <li>
                  <Link to="/new">
                    <NavBarItem title="Add Task" />
                  </Link>
                </li>
                <Link to="/mytasks">
                  <NavBarItem title="My Tasks" />
                </Link>
              </>
            ) : (
              <li />
            )}
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
