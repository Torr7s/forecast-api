import nock from 'nock';

import { GeoPosition } from '@src/shared/infra/mongo/models/beach.model';

import { User } from '@src/shared/infra/mongo/models/user.model';

import { WithId } from '@src/repositories/base.repository';
import { MongoBeachRepository } from '@src/repositories/mongo/beach/beach.repository';
import { MongoUserRepository } from '@src/repositories/mongo/user/user.repository';

import apiForecastResponse1BeachFixture from '@tests/fixtures/api_forecast_response_1_beach.json';
import stormGlassWeather3HoursFixture from '@tests/fixtures/stormglass_weather_3_hours.json';

import CacheUtil from '@src/shared/utils/cache';

import { AuthProvider } from '@src/shared/container/providers/auth/auth.provider';

describe('Beach forecast functional tests', (): void => {
  const defaultUser = {
    name: 'John Doe',
    email: 'johndoe@gmail.com',
    password: 'youshallnotpass'
  }

  let user: WithId<User>;
  let token: string;

  beforeEach(async (): Promise<void> => {
    const mongoBeachRepo: MongoBeachRepository = new MongoBeachRepository()
    const mongoUserRepo: MongoUserRepository = new MongoUserRepository();

    await mongoBeachRepo.deleteAll();
    await mongoUserRepo.deleteAll();

    user = await mongoUserRepo.create(defaultUser);

    const defaultBeach = {
      lat: -33.792726,
      lng: 151.289824,
      name: 'Manly',
      position: GeoPosition.E,
      user: user.id
    }

    await mongoBeachRepo.create(defaultBeach);

    token = AuthProvider.signToken(user.id);

    CacheUtil.clearAllCache();
  });

  it('should return a forecast with just a few times', async (): Promise<void> => {
    const nockQuery = {
      lat: '-33.792726',
      lng: '151.289824',
      params: /(.*)/,
      source: 'noaa',
      end: /(.*)/
    }

    nock('https://api.stormglass.io:443', {
      encodedQueryParams: true,
      reqheaders: {
        Authorization: (): boolean =>
          true
      }
    })
      .defaultReplyHeaders({
        'access-control-allow-origin':
          '*'
      }).get('/v2/weather/point').query(nockQuery).reply(200, stormGlassWeather3HoursFixture)

    const { body, status } = await global.testRequest
      .get('/api/forecast')
      .set({ 'x-access-token': token });

    expect(status).toBe(200);
    expect(body).toEqual(apiForecastResponse1BeachFixture);
  });

  it('should return 500 if something goes wrong during processing', async (): Promise<void> => {
    const nockQuery = {
      lat: '-33.792726',
      lng: '151.289824'
    }

    nock('https://api.stormglass.io:443', {
      encodedQueryParams: true,
      reqheaders: {
        Authorization: (): boolean =>
          true
      }
    })
      .defaultReplyHeaders({
        'access-control-allow-origin':
          '*'
      }).get('/v2/weather/point').query(nockQuery).replyWithError('Something went wrong');

    const { status } = await global.testRequest
      .get('/api/forecast')
      .set({ 'x-access-token': token });

    expect(status).toBe(500);
  });
});