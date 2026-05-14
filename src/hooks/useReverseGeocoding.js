import { useEffect, useState } from "react";
import { convertToEmoji } from "../utils/countries";

const BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

export function useReverseGeocoding(lat, lng) {
  const [cityData, setCityData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    function () {
      if (!lat || !lng) return;

      let ignore = false;

      async function fetchCityData() {
        try {
          setIsLoading(true);
          setError("");

          const res = await fetch(
            `${BASE_URL}?latitude=${lat}&longitude=${lng}`,
          );
          const data = await res.json();

          if (!data.countryCode) {
            throw new Error(
              "That doesn't seem to be a city. Click somewhere else.",
            );
          }

          const nextCityData = {
            cityName:
              data.city ||
              data.locality ||
              data.localityInfo?.administrative?.[0]?.name ||
              "Unknown city",
            country: data.countryName || "Unknown country",
            countryCode: data.countryCode,
            emoji: convertToEmoji(data.countryCode),
            continent: data.continent || "Unknown continent",
            locality: data.locality || data.city || "",
            position: { lat: Number(lat), lng: Number(lng) },
            notes: "",
          };

          if (!ignore) setCityData(nextCityData);
        } catch (err) {
          if (!ignore) {
            setCityData(null);
            setError(err.message);
          }
        } finally {
          if (!ignore) setIsLoading(false);
        }
      }

      fetchCityData();

      return () => {
        ignore = true;
      };
    },
    [lat, lng],
  );

  return { cityData, isLoading, error };
}
