import { Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

const Help = () => {
  return (
    <div>
      <Heading className="text-2xl text-black">Need help?</Heading>
      <Text className="mt-2 text-sm leading-7 text-black/64">
        If you need delivery support, return guidance, or order clarification,
        use the links below.
      </Text>
      <div className="my-4 text-base-regular">
        <ul className="flex flex-col gap-y-3">
          <li>
            <LocalizedClientLink
              href="/contact"
              className="inline-flex border border-black/12 bg-white px-4 py-3 text-sm font-medium text-black transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#f6f9fc]"
            >
              Contact support
            </LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink
              href="/contact"
              className="inline-flex border border-black/12 bg-white px-4 py-3 text-sm font-medium text-black transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#f6f9fc]"
            >
              Returns & exchanges
            </LocalizedClientLink>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Help
