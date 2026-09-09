import { Button, Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <div className="flex flex-col gap-4 border border-black/10 bg-[#fbfbfb] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="pr-2">
        <Heading level="h2" className="text-2xl text-black sm:text-3xl">
          Already have an account?
        </Heading>
        <Text className="mt-2 text-sm leading-6 text-black/65 sm:text-base">
          Sign in for a better experience.
        </Text>
      </div>
      <div className="sm:min-w-[140px]">
        <LocalizedClientLink href="/account">
          <Button
            variant="secondary"
            className="h-11 w-full"
            data-testid="sign-in-button"
          >
            Sign in
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
