import ServiceCard from '../components/ServiceCard'
import { useStore } from '../lib/store'
import { useRequestAction } from '../lib/useRequestAction'

export default function Services() {
  const { db } = useStore()
  const request = useRequestAction()
  const categories = [...new Set(db.services.map((service) => service.cat))]

  return (
    <>
      <h1>Services</h1>
      <p className="lead">
        Daily recharges, bills and loan repayments, grouped so you find them fast.
      </p>

      {categories.map((category) => (
        <section key={category}>
          <h2>{category}</h2>
          <div className="grid">
            {db.services
              .filter((service) => service.cat === category)
              .map((service) => (
                <ServiceCard
                  key={service.id}
                  icon={service.icon}
                  title={service.name}
                  text={service.desc}
                  onAction={() => request(service.name)}
                />
              ))}
          </div>
        </section>
      ))}
    </>
  )
}
