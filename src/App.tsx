import React, { useEffect, useState } from 'react';
import { Grommet, Box, Select, Card, CardBody, CardFooter, Grid, Text, DataChart } from 'grommet';
import _ from 'lodash';
import moment from 'moment';
import { flexclub } from './theme';

interface CityOptions {
    name?: string;
    lat?: string;
    lon?: string;
}

const App = () => {
    const options: CityOptions[] = [
        { name: 'Guadalajara', lat: '20.676667', lon: '-103.3475' },
        { name: 'Amsterdam', lat: '52.366667', lon: '4.9' },
        { name: 'Cape Town', lat: '-33.925278', lon: '18.423889' },
    ];
    const [cityValue, setCityValue] = useState<CityOptions>(options[0]);
    const [fullData, setFullData] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);
    const [selectedDay, setSelectedDay] = useState('');
    const [hourlyData, setHourlyData] = useState<any[]>([]);
    const [noon, setNoon] = useState<Date>();
    const [chartData, setChartData] = useState<any[]>([]);
    const apiConfig = process.env.REACT_APP_API_KEY;

    useEffect(
        () => {
            if (!_.isEmpty(cityValue)) {
                const weatherURL = `http://api.openweathermap.org/data/2.5/forecast?lat=${cityValue.lat}&lon=${cityValue.lon}&units=metric&APPID=${apiConfig}`;
                fetch(weatherURL).then((res) => res.json()).then((data) => {
                    const weeklyDataVal = !_.isEmpty(data.list) ? data.list.filter((reading: any) => reading.dt_txt.includes('12:00:00')) : [];
                    const date = !_.isUndefined(data.city) && !_.isUndefined(data.sunrise) ? new Date(data.city.sunrise * 1000) : new Date();
                    const date_two = !_.isUndefined(data.city) && !_.isUndefined(data.sunset) ? new Date(data.city.sunset * 1000) : new Date();
                    const midpoint = new Date((date.getTime() + date_two.getTime()) / 2); /* Calculation for solar noon */

                    if (selectedDay === '') {
                        const firstDay = !_.isEmpty(data.list) ? moment(new Date().setTime(data.list[0].dt * 1000)).format('dddd') : '';
                        setSelectedDay(firstDay);
                    }

                    setFullData(data.list);
                    setWeeklyData(weeklyDataVal);
                    setNoon(midpoint);
                });
            }
        },
        [cityValue]
    );

    useEffect(
        () => {
            const el1 = document.getElementById('background');
            const el2 = document.getElementsByClassName('owf');

            /* To Do: Include noon - midnight spectrum, for now it's 30 secs just to see the animation */

            if (!_.isNull(el1) && !_.isNull(noon) && !_.isUndefined(noon)) {
                el1.animate(
                    [
                        {
                            // from
                            backgroundColor: '#95c4ff',
                        },
                        {
                            // to
                            backgroundColor: '#030035',
                        },
                    ],
                    {
                        // timing options
                        duration: 30000,
                        iterations: Infinity,
                    }
                );
            }

            if (!_.isNull(el2) && !_.isNull(noon) && !_.isUndefined(noon)) {
                for (let i = 0; i < el2.length; i++) {
                    el2[i].animate(
                        [
                            {
                                // from
                                color: '#fff',
                            },
                            {
                                // to
                                color: '#000',
                            },
                        ],
                        {
                            // timing options
                            duration: 30000,
                            iterations: Infinity,
                        }
                    );
                }
            }
        },
        [noon, cityValue]
    );

    useEffect(
        () => {
            if (selectedDay !== '' && !_.isEmpty(fullData)) {
                let weeklyDataVal = fullData.filter((day: any) => moment(new Date().setTime(day.dt * 1000)).format('dddd') === selectedDay);
                setHourlyData(weeklyDataVal);
            }
        },
        [selectedDay, cityValue, fullData]
    );

    useEffect(
        () => {
            if (!_.isEmpty(hourlyData)) {
                let chart = [];
                for (let i = 0; i < hourlyData.length; i++) {
                    chart.push({
                        hour: moment(new Date(hourlyData[i].dt_txt)).format('hh:mm a'),
                        temp: Math.round(hourlyData[i].main.temp),
                    });
                }

                setChartData(chart);
            }
        },
        [hourlyData]
    );

    const CardData = (value: any) => {
        const weather = value.value;
        const newDate = new Date();
        const weekday = weather.dt * 1000;
        newDate.setTime(weekday);

        const imgURL = `owf owf-${weather.weather[0].id} owf-5x`;

        return (
            <React.Fragment>
                <Card
                    key={value.title}
                    align="center"
                    justify="center"
                    background={'brand'}
                    onClick={() => {
                        setSelectedDay(moment(newDate).format('dddd'));
                    }}
                >
                    <CardBody pad="small">
                        <Box gap="small" justify="center" direction="row" pad="small">
                            <Text size="small" weight="bold">
                                {moment(newDate).format('dddd')}
                            </Text>
                        </Box>
                        <Box gap="small" justify="center" direction="row" pad="small">
                            <Box>
                                <i className={imgURL} />
                            </Box>
                        </Box>
                        <Box gap="small" justify="center" direction="row" pad="small">
                            <Text size="small">{Math.round(weather.main.temp)} &deg;C</Text>
                        </Box>
                    </CardBody>
                    <CardFooter justify="center" pad={{ horizontal: 'medium', vertical: 'small' }}>
                        <Text size="xsmall">{weather.weather[0].description}</Text>
                    </CardFooter>
                </Card>
            </React.Fragment>
        );
    };

    return (
        <Grommet theme={flexclub} full>
            <Box id="background" overflow={{ horizontal: 'hidden' }}>
                <Box pad={{ horizontal: 'medium', vertical: 'large' }}>
                    <Select
                        id="select"
                        name="select"
                        placeholder="Select City"
                        valueKey="name"
                        labelKey="name"
                        value={cityValue}
                        options={options}
                        onChange={(option: any) => {
                            setCityValue(option.option);
                        }}
                    />
                </Box>

                <Box pad={{ horizontal: 'medium', vertical: 'large' }}>
                    <Grid gap="small" columns={{ count: 'fit', size: 'small' }}>
                        {!_.isEmpty(weeklyData) ? weeklyData.map((value: any) => <CardData key={value.title} value={value} />) : ''}
                    </Grid>
                </Box>

                <Box background={'brand'} margin={'medium'} round={'small'} elevation={'small'} pad={{ horizontal: 'medium', vertical: 'large' }}>
                    <DataChart
                        data={chartData}
                        series={['hour', 'temp']}
                        chart={[
                            { property: 'temp', type: 'line', opacity: 'medium', thickness: 'xsmall' },
                            {
                                property: 'temp',
                                type: 'point',
                                point: 'star',
                                thickness: 'medium',
                            },
                        ]}
                        guide={{ x: { granularity: 'coarse' }, y: { granularity: 'fine' } }}
                        size={{ width: 'fill' }}
                        gap="xsmall"
                        detail
                    />
                </Box>
            </Box>
        </Grommet>
    );
};

export default App;
