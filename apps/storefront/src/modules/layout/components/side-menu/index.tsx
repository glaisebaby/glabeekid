"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import { Locale } from "@lib/data/locales"
import useToggleState from "@lib/hooks/use-toggle-state"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text, clx } from "@modules/common/components/ui"
import { Fragment } from "react"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"

const SideMenuItems = {
  Home: "/",
  Store: "/store",
  Collections: "/collections",
  Account: "/account",
  Cart: "/cart",
}

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

const SideMenu = ({ regions, locales, currentLocale }: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()
  const countryCount = new Set(
    regions?.flatMap((region) => region.countries?.map((country) => country.iso_2) || []) || []
  ).size

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="glabee-panel relative inline-flex items-center bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-black shadow-none hover:-translate-y-0.5 hover:border-black/25 hover:bg-white"
                >
                  Menu
                </Popover.Button>
              </div>

              {open && (
                <div
                  className="fixed inset-0 z-[50] bg-[rgba(10,10,12,0.36)] backdrop-blur-[6px]"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0"
                enterTo="opacity-100 backdrop-blur-2xl"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 backdrop-blur-2xl"
                leaveTo="opacity-0"
              >
                <PopoverPanel className="fixed inset-y-0 left-0 z-[60] flex w-full max-w-[420px] min-w-min flex-col p-4 text-sm text-ui-fg-on-color sm:p-5">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex h-full flex-col justify-between overflow-hidden border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,252,0.98))] p-5 text-black shadow-[0_32px_90px_rgba(15,23,42,0.18)] sm:p-6"
                  >
                    <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.06),transparent_58%),radial-gradient(circle_at_top_right,rgba(0,0,0,0.03),transparent_42%)]" />
                    <div className="relative flex justify-between">
                      <div>
                        <Text className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/45">
                          Glabeekid
                        </Text>
                        <Text className="mt-2 max-w-[220px] text-sm leading-6 text-black/62">
                          Playful fashion, presented with a cleaner shopping flow.
                        </Text>
                      </div>
                      <button
                        data-testid="close-menu-button"
                        onClick={close}
                        className="inline-flex h-10 w-10 items-center justify-center border border-black/10 bg-white text-black/72 transition-colors hover:bg-black hover:text-white"
                      >
                        <XMark />
                      </button>
                    </div>
                    <ul className="relative mt-8 flex flex-col items-start justify-start gap-2 sm:mt-10">
                      {Object.entries(SideMenuItems).map(([name, href]) => (
                        <li key={name}>
                          <LocalizedClientLink
                            href={href}
                            className="group inline-flex items-center gap-3 px-4 py-3 text-[1.5rem] font-semibold leading-none tracking-[-0.03em] text-black transition-all duration-200 hover:bg-black hover:text-white sm:text-[2rem]"
                            onClick={close}
                            data-testid={`${name.toLowerCase()}-link`}
                          >
                            <span className="h-2 w-2 bg-black/18 transition-colors group-hover:bg-white/70" />
                            {name}
                          </LocalizedClientLink>
                        </li>
                      ))}
                    </ul>
                    <div className="relative mt-10 flex flex-col gap-y-5">
                      <div className="border border-black/10 bg-[#f6f8fb] px-5 py-5 text-black">
                        <Text className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/48">
                          Shopping notes
                        </Text>
                        <Text className="mt-3 text-sm leading-7 text-black/70">
                          Clear pricing, simple delivery choices, and fit guidance stay close to each product so parents can move quickly.
                        </Text>
                      </div>
                      {!!locales?.length && (
                        <div
                          className="flex justify-between border border-black/10 bg-white px-4 py-3 text-black shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                          onMouseEnter={languageToggleState.open}
                          onMouseLeave={languageToggleState.close}
                        >
                          <LanguageSelect
                            toggleState={languageToggleState}
                            locales={locales}
                            currentLocale={currentLocale}
                          />
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      {countryCount > 1 ? (
                        <div
                          className="flex justify-between border border-black/10 bg-white px-4 py-3 text-black shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                          onMouseEnter={countryToggleState.open}
                          onMouseLeave={countryToggleState.close}
                        >
                          {regions && (
                            <CountrySelect
                              toggleState={countryToggleState}
                              regions={regions}
                            />
                          )}
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150",
                              countryToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      ) : (
                        <div className="border border-black/10 bg-white px-4 py-3 text-black shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                          <Text className="text-sm font-medium text-black/70">
                            Shipping across India
                          </Text>
                        </div>
                      )}
                      <Text className="flex justify-between border-t border-black/8 pt-1 txt-compact-small text-black/46">
                        Copyright {new Date().getFullYear()} Glabeekid. All
                        rights reserved.
                      </Text>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
