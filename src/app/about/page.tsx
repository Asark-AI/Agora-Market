
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const problems = [
    {
        number: "1",
        title: "Local Businesses Lack Visibility",
        problem: "Many Ghanaian artisans and small business owners struggle to reach customers online.",
        solution: "We give every entrepreneur a professional online space to showcase and sell their products or services — no coding or technical skills needed."
    },
    {
        number: "2",
        title: "High Barriers to Enter E-commerce",
        problem: "Current marketplaces favor big brands and ignore smaller sellers.",
        solution: "Agora’s inclusive platform allows anyone to start selling — from tailors and phone repairers to manufacturers — with low fees and an easy setup."
    },
    {
        number: "3",
        title: "Fragmented Local Trade",
        problem: "Local buyers must visit multiple platforms or physical stores to find what they need.",
        solution: "Agora unifies all business types — online stores, service providers, and repair shops — into one convenient marketplace."
    },
    {
        number: "4",
        title: "Lack of Trust in Online Payments",
        problem: "Fear of fraud discourages many people from shopping online.",
        solution: "With secure payments, verified sellers, and buyer protection, Agora builds the trust needed for safe and confident transactions."
    },
    {
        number: "5",
        title: "Poor Logistics and After-Sales Systems",
        problem: "Small sellers often can’t manage delivery and support efficiently.",
        solution: "Agora integrates delivery tracking and logistics partners for smooth, reliable post-purchase experiences."
    },
    {
        number: "6",
        title: "No Access to Business Insights",
        problem: "Sellers don’t have access to data that can help them grow.",
        solution: "Our dashboard provides analytics on customer behavior, sales trends, and product performance — empowering smarter decisions."
    },
    {
        number: "7",
        title: "“Made in Ghana” Products Lack Exposure",
        problem: "Local goods are overshadowed by imported ones.",
        solution: "Agora highlights and promotes Ghanaian-made products, helping local creators and producers reach broader markets."
    },
    {
        number: "8",
        title: "Limited Collaboration Between Businesses",
        problem: "Businesses often operate in isolation, missing partnership opportunities.",
        solution: "Agora connects manufacturers, suppliers, and retailers within one digital space — making partnerships simple and efficient."
    },
    {
        number: "9",
        title: "Outdated and Unpersonalized Experiences",
        problem: "Many platforms don’t offer intelligent recommendations or tailored shopping.",
        solution: "Agora uses AI-powered product matching, search, and pricing insights to personalize every user’s experience."
    },
    {
        number: "10",
        title: "Dependence on Foreign Platforms",
        problem: "Africa’s e-commerce is dominated by foreign systems that drain value out of local economies.",
        solution: "Agora is proudly African — built to keep profits, data, and innovation within the continent."
    }
];

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-5xl py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">🌍 About Agora</h1>
        <p className="text-xl text-muted-foreground">
          Empowering Local Commerce Through Innovation
        </p>
      </div>

      <div className="prose lg:prose-lg max-w-none text-center mb-16">
        <p>
            Agora is a next-generation e-commerce and business platform built to connect buyers, sellers, manufacturers, and service providers in one unified ecosystem. Our mission is simple — to make it easy for anyone in Ghana and across Africa to buy, sell, and grow using technology.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">💡 Our Mission</h2>
            <p className="text-muted-foreground">
                To empower local entrepreneurs and businesses with digital tools that help them showcase their products and services, reach a wider audience, and grow sustainably — all while promoting Made-in-Africa innovation.
            </p>
        </div>
         <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">🌠 Our Vision</h2>
            <p className="text-muted-foreground">
                To become Africa’s most trusted and inclusive digital marketplace — where every business, no matter its size or type, can thrive in the global economy.
            </p>
        </div>
      </div>

      <Separator className="my-12" />

      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold font-headline">⚙️ The Problems We’re Solving</h2>
        <p className="text-lg text-muted-foreground mt-2">...and How Agora Fixes Them</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {problems.map((item) => (
          <Card key={item.number} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-start gap-3">
                <span className="text-2xl font-black text-primary">{item.number}</span>
                <span>{item.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div>
                    <h4 className="font-semibold text-destructive">Problem:</h4>
                    <p className="text-sm text-muted-foreground">{item.problem}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-primary">Agora’s Solution:</h4>
                    <p className="text-sm text-muted-foreground">{item.solution}</p>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>

       <Separator className="my-12" />
      
       <div className="bg-primary/10 rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">🚀 The Future We’re Building</h2>
        <div className="prose lg:prose-lg max-w-none text-center text-primary/90">
          <p>Agora isn’t just an app — it’s a movement.</p>
          <p>We’re building a digital ecosystem for Africa’s future, where technology connects people, supports businesses, and strengthens local economies.</p>
          <p className="font-semibold">With Agora, every purchase supports growth, every sale creates opportunity, and every connection builds Africa’s next generation of entrepreneurs.</p>
        </div>
      </div>
    </div>
  );
}
