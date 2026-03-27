import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Problem } from "@/components/landing/Problem";
import { Features } from "@/components/landing/Features";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { SocialProof } from "@/components/landing/SocialProof";
import { ValueStack } from "@/components/landing/ValueStack";
import { Bio } from "@/components/landing/Bio";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Problem />
      <Features />
      <BentoGrid />
      <SocialProof />
      <ValueStack />
      <Bio />
      <FAQ />
      <FinalCTA />
      <Footer />
    </>
  );
}
