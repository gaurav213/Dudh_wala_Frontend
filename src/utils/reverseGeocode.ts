export type PickedAddress = {
  addressLine1?: string
  area?: string
  city?: string
  state?: string
  postalCode?: string
}

function first(address: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = address[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

export function parseNominatimAddress(json: {
  display_name?: string
  address?: Record<string, unknown>
}): PickedAddress {
  const address = json.address ?? {}
  const roadBits = [
    first(address, ['house_number']),
    first(address, ['road', 'pedestrian', 'path']),
  ].filter(Boolean)
  const addressLine1 =
    roadBits.length > 0
      ? roadBits.join(' ')
      : json.display_name?.split(',')[0]?.trim()

  return {
    addressLine1,
    area: first(address, [
      'village',
      'hamlet',
      'suburb',
      'neighbourhood',
      'city_district',
      'quarter',
    ]),
    city: first(address, ['city', 'town', 'municipality', 'county']),
    state: first(address, ['state']),
    postalCode: first(address, ['postcode']),
  }
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<PickedAddress> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('lat', String(latitude))
    url.searchParams.set('lon', String(longitude))
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('addressdetails', '1')
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    })
    if (res.ok) {
      const picked = parseNominatimAddress(
        (await res.json()) as { display_name?: string; address?: Record<string, unknown> },
      )
      if (picked.addressLine1 || picked.area || picked.city || picked.state || picked.postalCode) {
        return picked
      }
    }
  } catch {
    // Nominatim often blocks browsers — fall through.
  }

  const fallback = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client')
  fallback.searchParams.set('latitude', String(latitude))
  fallback.searchParams.set('longitude', String(longitude))
  fallback.searchParams.set('localityLanguage', 'en')
  const res = await fetch(fallback.toString())
  if (!res.ok) throw new Error('Could not read address')
  const json = (await res.json()) as {
    locality?: string
    city?: string
    principalSubdivision?: string
    postcode?: string
  }
  return {
    addressLine1: json.locality || json.city,
    area: json.locality,
    city: json.city,
    state: json.principalSubdivision,
    postalCode: json.postcode,
  }
}
