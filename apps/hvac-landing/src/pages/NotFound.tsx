import Seo from '../components/Seo'
import PageHero from '../components/ui/PageHero'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <>
      <Seo title="Page not found" description="The page you were looking for could not be found." />
      <PageHero title="Page not found" description="The page you’re looking for has moved or doesn’t exist.">
        <Button to="/" variant="inverse" size="lg">
          Back to home
        </Button>
        <Button to="/intelligence" variant="outline-inverse" size="lg">
          Intelligence Modules
        </Button>
      </PageHero>
    </>
  )
}
