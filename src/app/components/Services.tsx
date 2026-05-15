export default function Services() {
  const services = [
    {
      title: 'Civil & Criminal',
      description: 'Property disputes, breach of contract, debt recovery, and criminal defense representation.',
      icon: '⚖️',
    },
    {
      title: 'Family Law',
      description: 'Family law issues, special proceedings, and matters affecting your family handled with care.',
      icon: '👨‍👩‍👧‍👦',
    },
    {
      title: 'Real Estate',
      description: 'Property and real estate transactions, documentation, and dispute resolution.',
      icon: '🏠',
    },
    {
      title: 'Estate Planning',
      description: 'Estate settlement, inheritance matters, and succession planning.',
      icon: '📋',
    },
    {
      title: 'Corporate & Business',
      description: 'Business registration, corporate matters, contracts, and legal documentation.',
      icon: '💼',
    },
    {
      title: 'Notarial Services',
      description: 'Document authentication, certification, and notarization services.',
      icon: '✍️',
    },
  ];

  return (
    <section id="services" className="py-20 bg-white dark:bg-black">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            Practice Areas
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Comprehensive legal services tailored to meet your specific needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-zinc-50 dark:bg-zinc-900 p-8 rounded-lg hover:shadow-xl transition-shadow duration-300 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="text-5xl mb-4">{service.icon}</div>
              <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                {service.title}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-lg text-zinc-700 dark:text-zinc-300 mb-6">
            Don't see what you're looking for? We handle many other legal matters.
          </p>
          <a
            href="#appointment"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
          >
            Contact Us Today
          </a>
        </div>
      </div>
    </section>
  );
}
