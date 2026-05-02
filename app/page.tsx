import { WelcomeBanner } from "@/components/dashboard/welcome-banner"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import { SectionShortcuts } from "@/components/dashboard/section-shortcuts"
import { HomePreviews } from "@/components/dashboard/home-previews"

export default function Page() {
  return (
    <>
      <WelcomeBanner />
      <SummaryCards />
      <SectionShortcuts />
      <HomePreviews />
    </>
  )
}