import Header from './_shared/Header'
import Hero from './_shared/Hero'
import ProjectList from './_shared/ProjectList'

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Header />
      <Hero />
      <ProjectList />
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] bg-purple-400/20 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute top-20 right-[-200px] h-[500px] w-[500px] bg-pink-400/20 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute bottom-[-200px] left-1/3 h-[500px] w-[500px] bg-blue-400/20 blur-[120px] rounded-full" />
    </div>
  )
}
