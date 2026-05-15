export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 dark:from-zinc-950 dark:via-blue-950 dark:to-zinc-900 text-white py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Abigail Miller Law Office
          </h1>
          <p className="text-xl md:text-2xl mb-4 text-blue-100">
            Experienced Legal Representation You Can Trust
          </p>
          <p className="text-lg mb-8 text-blue-200 max-w-2xl">
            With over a decade of experience, we provide personalized legal solutions 
            tailored to your unique needs. From family law to business matters, 
            we're here to guide you through every step.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#appointment"
              className="inline-block bg-white text-blue-900 font-semibold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors duration-200 text-center"
            >
              Schedule Consultation
            </a>
            <a
              href="#services"
              className="inline-block bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white/10 transition-colors duration-200 text-center"
            >
              Our Services
            </a>
          </div>
        </div>
      </div>
      
      {/* Decorative element */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-black to-transparent"></div>
    </section>
  );
}
