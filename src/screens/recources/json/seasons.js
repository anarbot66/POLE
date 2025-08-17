// Пример структуры данных
const seasons = {
  verstappen: {
    2015: "Toro Rosso",
    2016: "Toro Rosso / Red Bull",
    2017: "Red Bull",
    2018: "Red Bull",
    2019: "Red Bull",
    2020: "Red Bull",
    2021: "Red Bull",
    2022: "Red Bull",
    2023: "Red Bull",
    2024: "Red Bull"
  }
  ,
  hamilton: {
    2007: "McLaren",
    2008: "McLaren",
    2009: "McLaren",
    2010: "McLaren",
    2011: "McLaren",
    2012: "McLaren",
    2013: "Mercedes",
    2014: "Mercedes",
    2015: "Mercedes",
    2016: "Mercedes",
    2017: "Mercedes",
    2018: "Mercedes",
    2019: "Mercedes",
    2020: "Mercedes",
    2021: "Mercedes",
    2022: "Mercedes",
    2023: "Mercedes",
    2024: "Mercedes"
  }
  ,
  norris: {
    2019: "McLaren",
    2020: "McLaren",
    2021: "McLaren",
    2022: "McLaren",
    2023: "McLaren",
    2024: "McLaren"
  },
  piastri: {
    2023: "McLaren",
    2024: "McLaren"
  },
  albon: {
    2019: "Red Bull / Toro Rosso",
    2020: "Red Bull",
    2022: "Williams",
    2023: "Williams",
    2024: "Williams"
  },
  ocon: {
    2016: "Manor / Renault",
    2017: "Force India",
    2018: "Force India",
    2019: "Renault",
    2020: "Alpine F1 Team",
    2021: "Alpine F1 Team",
    2022: "Alpine F1 Team",
    2023: "Alpine F1 Team",
    2024: "Haas F1 Team"
  },
  stroll: {
    2017: "Williams",
    2018: "Williams",
    2019: "Racing Point",
    2020: "Racing Point",
    2021: "Aston Martin",
    2022: "Aston Martin",
    2023: "Aston Martin",
    2024: "Aston Martin"
  },
  tsunoda: {
    2021: "AlphaTauri",
    2022: "AlphaTauri",
    2023: "AlphaTauri",
    2024: "RB F1 Team"
  },
  hulkenberg: {
    2010: "Williams",
    2011: "Force India",
    2012: "Force India",
    2013: "Sauber",
    2014: "Force India",
    2015: "Force India",
    2016: "Force India",
    2017: "Renault",
    2018: "Renault",
    2019: "Renault",
    2020: "Racing Point",
    2022: "Aston Martin",
    2023: "Haas F1 Team",
    2024: "Haas F1 Team"
  },
  gasly: {
    2017: "Toro Rosso",
    2018: "Toro Rosso",
    2019: "Red Bull / Toro Rosso",
    2020: "AlphaTauri",
    2022: "AlphaTauri",
    2023: "AlphaTauri",
    2024: "Alpine F1 Team"
  },
  alonso: {
    2001: "Minardi",
    2003: "Renault",
    2004: "Renault",
    2005: "Renault",
    2006: "Renault",
    2007: "McLaren",
    2008: "Renault",
    2009: "Renault",
    2010: "Ferrari",
    2011: "Ferrari",
    2012: "Ferrari",
    2013: "Ferrari",
    2014: "Ferrari",
    2015: "McLaren",
    2016: "McLaren",
    2017: "McLaren",
    2018: "McLaren",
    2021: "Alpine F1 Team",
    2022: "Alpine F1 Team",
    2023: "Aston Martin",
    2024: "Aston Martin"
  },
  russell: {
    2019: "Williams",
    2021: "Williams / Mercedes",
    2022: "Williams",
    2023: "Mercedes",
    2024: "Mercedes"
  },
  sainz: {
    2015: "Toro Rosso",
    2016: "Toro Rosso",
    2017: "Toro Rosso / Renault",
    2018: "Renault",
    2019: "McLaren",
    2020: "McLaren",
    2021: "Ferrari",
    2022: "Ferrari",
    2023: "Ferrari",
    2024: "Ferrari",
  },
  leclerc: {
    2018: "Sauber",
    2019: "Ferrari",
    2021: "Ferrari",
    2022: "Ferrari",
    2023: "Ferrari",
    2024: "Ferrari",
  },
  bearman: {
    2024: "Ferrari"
  },
  lawson: {
    2023: "AlphaTauri",
    2024: "RB F1 Team"
  },
  doohan: {
    2024: "Alpine F1 Team"
  },
  colapinto: {
    2024: "Williams"
  },

  red_bull: [2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  mclaren: [1966, 1967, 1968, 1969, 1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  ferrari: [1950, 1951, 1952, 1953, 1954, 1955, 1956, 1957, 1958, 1959, 1960, 1961, 1962, 1963, 1964, 1965, 1966, 1967, 1968, 1969, 1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  aston_martin: [2021, 2022, 2023, 2024],
  alpine: [2021, 2022, 2023, 2024],
  haas: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  mercedes: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  williams: [1978, 1979, 1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  sauber: [1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  rb: [2024]
};

export default seasons;
