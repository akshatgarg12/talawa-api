const axios = require('axios');
const { URL } = require('../constants');
const getToken = require('./functions/getToken');

let token;
let createdOrgId;

beforeAll(async () => {
  token = await getToken();
});

describe('organization resolvers', () => {
  test('allOrganizations', async () => {
    const response = await axios.post(URL, {
      query: `{
                organizations {
                    _id
                    name
                }
            }
            `,
    });
    const { data } = response;
    expect(Array.isArray(data.data.organizations)).toBeTruthy();
  });

  test('createOrganization', async () => {
    const createdOrgResponse = await axios.post(
      URL,
      {
        query: `
              mutation {
                  createOrganization(data: {
                      name:"test org"
                      description:"test description"
                      isPublic: true
                      visibleInSearch: true
                      }) {
                          _id,
                          name, 
                          description,
                          creator{
                            email
                          },
                          admins{
                            email
                          },
                          members{
                            email
                          }
                      }
              }
                `,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const { data } = createdOrgResponse;
    createdOrgId = createdOrgResponse.data.data.createOrganization._id;
    expect(data.data.createOrganization).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        creator: expect.objectContaining({
          email: expect.any(String),
        }),
        admins: expect.any(Array),
        members: expect.any(Array),
      })
    );
    // test to check if userInfo has been updated
    const userInfoResponse = await axios.post(
      URL,
      {
        query: `
              query {
                  me {
                     joinedOrganizations{
                       _id
                     },
                     createdOrganizations{
                       _id
                     },
                     adminFor{
                       _id
                     }, 
                    }
                  }
                `,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const userData = userInfoResponse.data.data.me;
    expect(userData).toEqual(
      expect.objectContaining({
        joinedOrganizations: expect.arrayContaining([
          expect.objectContaining({
            _id: createdOrgId,
          }),
        ]),
        createdOrganizations: expect.arrayContaining([
          expect.objectContaining({
            _id: createdOrgId,
          }),
        ]),
        adminFor: expect.arrayContaining([
          expect.objectContaining({
            _id: createdOrgId,
          }),
        ]),
      })
    );
  });

  test('updateOrganization', async () => {
    const updateOrgRes = await axios.post(
      URL,
      {
        query: `
            mutation {
                updateOrganization(id: "${createdOrgId}", data: {
                    description: "new description",
                    isPublic: false
                    }) {
                        _id
                        description
                        isPublic
                    }
            }
              `,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { data } = updateOrgRes;

    expect(data).toMatchObject({
      data: {
        updateOrganization: {
          _id: `${createdOrgId}`,
          description: 'new description',
          isPublic: false,
        },
      },
    });
  });

  test('removeOrganization', async () => {
    const deletedResponse = await axios.post(
      URL,
      {
        query: `
            mutation {
                removeOrganization(id: "${createdOrgId}") {
                    _id
                }
            }
            `,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(deletedResponse.data.data.removeOrganization).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });
});
