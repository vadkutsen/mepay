import React, { Fragment } from "react";
import { Spinner } from "react-bootstrap";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Wallet = ({ address, amount, symbol, destroy }) => {
  if (address) {
    return (
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button
            className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-transparent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-900/75"
          >
            {amount ? (
              <>
                {amount} <span className="ms-1"> {symbol}</span>
              </>
            ) : (
              <Spinner animation="border" size="sm" className="opacity-25" />
            )}
            <ChevronDownIcon
              className="-mr-1 ml-2 h-5 w-5"
              aria-hidden="true"
            />
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md border border-gray-300 bg-transparent shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <a
                    href={`https://explorer.testnet.near.org/accounts/${address}`}
                    target="_blank"
                    rel="noreferrer"
                    className={classNames(
                      active ? "bg-purple-900/75 text-white" : "bg-transparent text-white",
                      "block px-4 py-2 text-sm text-center"
                    )}
                  >
                    {address}
                  </a>
                )}
              </Menu.Item>
            </div>
            <div className="py-1">
              <Menu.Item
                as="button"
                onClick={() => {
                  destroy();
                }}
                className="w-full"
              >
                {({ active }) => (
                  <a
                    href="#"
                    className={classNames(
                      active ? "bg-purple-900/75 text-white" : "bg-transparent text-white",
                      "block px-4 py-2 text-sm"
                    )}
                  >
                    Disconnect
                  </a>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    );
  }
  return null;
};
export default Wallet;
