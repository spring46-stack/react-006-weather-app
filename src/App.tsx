import { useState } from "react";

type Weather = {
  temperature: number;
  humidity: number;
  weatherCode: number;
};

// 日本語の都市名をAPIで検索できる英語に変換する
const cityMap: Record<string, string> = {
  東京: "Tokyo",
  大阪: "Osaka",
  名古屋: "Nagoya",
  福岡: "Fukuoka",
  札幌: "Sapporo",
  横浜: "Yokohama",
  京都: "Kyoto",
  神戸: "Kobe",
  仙台: "Sendai",
  広島: "Hiroshima",
};

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [searchedCity, setSearchedCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!city.trim()) {
      setError("都市名を入力してください");
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      // 入力された日本語の都市名を英語に変換
      const searchCity = cityMap[city.trim()] ?? city.trim();

      // 都市名から緯度・経度を取得
      const locationResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          searchCity,
        )}&count=1&language=ja&format=json`,
      );

      if (!locationResponse.ok) {
        throw new Error("都市情報を取得できませんでした");
      }

      const locationData = await locationResponse.json();

      if (!locationData.results || locationData.results.length === 0) {
        throw new Error("都市が見つかりませんでした");
      }

      const location = locationData.results[0];

      // 緯度・経度から天気を取得
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia%2FTokyo`,
      );

      if (!weatherResponse.ok) {
        throw new Error("天気情報を取得できませんでした");
      }

      const weatherData = await weatherResponse.json();

      // 天気情報をstateに保存
      setWeather({
        temperature: weatherData.current.temperature_2m,
        humidity: weatherData.current.relative_humidity_2m,
        weatherCode: weatherData.current.weather_code,
      });

      // 画面に表示する都市名
      setSearchedCity(location.name);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("予期しないエラーが発生しました");
      }
    } finally {
      setLoading(false);
    }
  };

  // 天気コードを日本語に変換
  const getWeatherText = (weatherCode: number) => {
    if (weatherCode === 0) {
      return "☀️ 晴れ";
    }

    if (weatherCode >= 1 && weatherCode <= 3) {
      return "⛅ 曇り";
    }

    if (weatherCode >= 51 && weatherCode <= 67) {
      return "🌧️ 雨";
    }

    if (weatherCode >= 71 && weatherCode <= 77) {
      return "❄️ 雪";
    }

    if (weatherCode >= 80 && weatherCode <= 82) {
      return "🌧️ にわか雨";
    }

    if (weatherCode >= 95) {
      return "⛈️ 雷雨";
    }

    return "天気不明";
  };

  return (
    <main>
      <h1>天気検索アプリ</h1>

      <div>
        <label htmlFor="city">都市名</label>

        <input
          id="city"
          type="text"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="例：東京"
        />

        <button onClick={handleSearch} disabled={loading}>
          {loading ? "検索中..." : "天気を検索"}
        </button>
      </div>

      {error && <p>{error}</p>}

      {weather && (
        <section>
          <h2>{searchedCity}の天気</h2>

          <p>
            天気：
            {getWeatherText(weather.weatherCode)}
          </p>

          <p>気温：{weather.temperature}℃</p>

          <p>湿度：{weather.humidity}%</p>
        </section>
      )}
    </main>
  );
}

export default App;
