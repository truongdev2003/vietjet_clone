const mongoose = require('mongoose');
const Airport = require('./models/Airport');
const Flight = require('./models/Flight');
const User = require('./models/User');
const { Promotion } = require('./models/Additional');
require('dotenv').config();

// Sample data for Vietnamese airports
const airports = [
  {
    code: 'SGN',
    name: 'Tan Son Nhat International Airport',
    city: 'Ho Chi Minh City',
    country: 'Vietnam',
    timezone: 'Asia/Ho_Chi_Minh'
  },
  {
    code: 'HAN',
    name: 'Noi Bai International Airport',
    city: 'Hanoi',
    country: 'Vietnam',
    timezone: 'Asia/Ho_Chi_Minh'
  },
  {
    code: 'DAD',
    name: 'Da Nang International Airport',
    city: 'Da Nang',
    country: 'Vietnam',
    timezone: 'Asia/Ho_Chi_Minh'
  },
  {
    code: 'CXR',
    name: 'Cam Ranh International Airport',
    city: 'Nha Trang',
    country: 'Vietnam',
    timezone: 'Asia/Ho_Chi_Minh'
  },
  {
    code: 'PQC',
    name: 'Phu Quoc International Airport',
    city: 'Phu Quoc',
    country: 'Vietnam',
    timezone: 'Asia/Ho_Chi_Minh'
  },
  {
    code: 'VCA',
    name: 'Can Tho International Airport',
    city: 'Can Tho',
    country: 'Vietnam',
    timezone: 'Asia/Ho_Chi_Minh'
  },
  {
    code: 'HPH',
    name: 'Cat Bi International Airport',
    city: 'Hai Phong',
    country: 'Vietnam',
    timezone: 'Asia/Ho_Chi_Minh'
  },
  {
    code: 'VDH',
    name: 'Dong Hoi Airport',
    city: 'Dong Hoi',
    country: 'Vietnam',
    timezone: 'Asia/Ho_Chi_Minh'
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vietjet_clone', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Airport.deleteMany({});
    await Flight.deleteMany({});
    await User.deleteMany({});
    await Promotion.deleteMany({});

    console.log('Cleared existing data');

    // Insert airports
    const insertedAirports = await Airport.insertMany(airports);
    console.log('Airports seeded successfully');

    // Create sample user
    const sampleUser = new User({
      personalInfo: {
        title: 'Mr',
        firstName: 'Nguyen',
        lastName: 'Van A',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        nationality: 'Vietnam'
      },
      contactInfo: {
        email: 'test@vietjet.com',
        phone: '0901234567',
        address: {
          street: '123 Nguyen Hue',
          ward: 'Ben Nghe',
          district: 'District 1',
          city: 'Ho Chi Minh City',
          province: 'Ho Chi Minh',
          country: 'Vietnam',
          zipCode: '700000'
        }
      },
      account: {
        password: 'password123'
      },
      documents: [{
        type: 'passport',
        number: 'P123456789',
        expiryDate: new Date('2030-12-31'),
        issuedCountry: 'Vietnam',
        isPrimary: true
      }],
      preferences: {
        language: 'vi',
        currency: 'VND',
        seatPreference: 'window',
        mealPreference: 'normal'
      }
    });

    await sampleUser.save();
    console.log('Sample user created');

    // Create sample flights with new structure
    const flights = [];
    const today = new Date();
    
    // Generate flights for next 30 days
    for (let day = 0; day < 30; day++) {
      const flightDate = new Date(today);
      flightDate.setDate(today.getDate() + day);
      
      // SGN to HAN flights
      const sgnAirport = insertedAirports.find(a => a.code === 'SGN');
      const hanAirport = insertedAirports.find(a => a.code === 'HAN');
      
      flights.push({
        flightNumber: `VJ${100 + day * 2}`,
        airline: {
          code: 'VJ',
          name: 'VietJet Air'
        },
        route: {
          departure: {
            airport: sgnAirport._id,
            time: new Date(flightDate.setHours(6, 30, 0, 0)),
            terminal: 'T1',
            scheduledTime: new Date(flightDate.setHours(6, 30, 0, 0))
          },
          arrival: {
            airport: hanAirport._id,
            time: new Date(flightDate.setHours(8, 45, 0, 0)),
            terminal: 'T2',
            scheduledTime: new Date(flightDate.setHours(8, 45, 0, 0))
          },
          distance: 1166,
          duration: {
            scheduled: 135
          }
        },
        aircraft: {
          type: 'Airbus A321',
          registration: 'VN-A321',
          configuration: {
            economy: {
              rows: 30,
              seatsPerRow: 6,
              totalSeats: 180
            },
            business: {
              rows: 4,
              seatsPerRow: 4,
              totalSeats: 16
            }
          }
        },
        pricing: {
          economy: {
            base: 1200000,
            saver: 999000,
            classic: 1200000,
            flexible: 1500000
          },
          business: {
            base: 2400000,
            flexible: 2800000
          }
        },
        seats: {
          economy: { total: 180, available: 180, blocked: 0 },
          premiumEconomy: { total: 0, available: 0, blocked: 0 },
          business: { total: 16, available: 16, blocked: 0 },
          first: { total: 0, available: 0, blocked: 0 }
        },
        services: {
          meals: {
            available: true,
            types: [
              { type: 'normal', price: 0 },
              { type: 'vegetarian', price: 0 }
            ]
          },
          baggage: {
            carryOn: {
              weight: 7,
              dimensions: '56x36x23cm'
            },
            checked: [
              { weight: 20, price: 0 },
              { weight: 30, price: 200000 }
            ]
          },
          entertainment: {
            wifi: { available: false },
            ife: false
          }
        },
        frequency: {
          isRegular: true,
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          seasonality: 'year_round'
        },
        metadata: {
          isActive: 'active'
        }
      });

      // HAN to SGN flights
      flights.push({
        flightNumber: `VJ${101 + day * 2}`,
        airline: {
          code: 'VJ',
          name: 'VietJet Air'
        },
        route: {
          departure: {
            airport: hanAirport._id,
            time: new Date(flightDate.setHours(14, 15, 0, 0)),
            terminal: 'T2',
            scheduledTime: new Date(flightDate.setHours(14, 15, 0, 0))
          },
          arrival: {
            airport: sgnAirport._id,
            time: new Date(flightDate.setHours(16, 30, 0, 0)),
            terminal: 'T1',
            scheduledTime: new Date(flightDate.setHours(16, 30, 0, 0))
          },
          distance: 1166,
          duration: {
            scheduled: 135
          }
        },
        aircraft: {
          type: 'Airbus A321',
          registration: 'VN-A322',
          configuration: {
            economy: {
              rows: 30,
              seatsPerRow: 6,
              totalSeats: 180
            },
            business: {
              rows: 4,
              seatsPerRow: 4,
              totalSeats: 16
            }
          }
        },
        pricing: {
          economy: {
            base: 1200000,
            saver: 999000,
            classic: 1200000,
            flexible: 1500000
          },
          business: {
            base: 2400000,
            flexible: 2800000
          }
        },
        seats: {
          economy: { total: 180, available: 180, blocked: 0 },
          premiumEconomy: { total: 0, available: 0, blocked: 0 },
          business: { total: 16, available: 16, blocked: 0 },
          first: { total: 0, available: 0, blocked: 0 }
        },
        services: {
          meals: {
            available: true,
            types: [
              { type: 'normal', price: 0 },
              { type: 'vegetarian', price: 0 }
            ]
          },
          baggage: {
            carryOn: {
              weight: 7,
              dimensions: '56x36x23cm'
            },
            checked: [
              { weight: 20, price: 0 },
              { weight: 30, price: 200000 }
            ]
          },
          entertainment: {
            wifi: { available: false },
            ife: false
          }
        },
        frequency: {
          isRegular: true,
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          seasonality: 'year_round'
        },
        metadata: {
          isActive: 'active'
        }
      });

      // SGN to DAD flights (every other day)
      if (day % 2 === 0) {
        const dadAirport = insertedAirports.find(a => a.code === 'DAD');
        
        flights.push({
          flightNumber: `VJ${200 + day}`,
          airline: {
            code: 'VJ',
            name: 'VietJet Air'
          },
          route: {
            departure: {
              airport: sgnAirport._id,
              time: new Date(flightDate.setHours(10, 0, 0, 0)),
              terminal: 'T1',
              scheduledTime: new Date(flightDate.setHours(10, 0, 0, 0))
            },
            arrival: {
              airport: dadAirport._id,
              time: new Date(flightDate.setHours(11, 20, 0, 0)),
              terminal: 'T1',
              scheduledTime: new Date(flightDate.setHours(11, 20, 0, 0))
            },
            distance: 608,
            duration: {
              scheduled: 80
            }
          },
          aircraft: {
            type: 'Airbus A320',
            registration: 'VN-A320',
            configuration: {
              economy: {
                rows: 25,
                seatsPerRow: 6,
                totalSeats: 150
              },
              business: {
                rows: 2,
                seatsPerRow: 4,
                totalSeats: 8
              }
            }
          },
          pricing: {
            economy: {
              base: 800000,
              saver: 699000,
              classic: 800000,
              flexible: 1000000
            },
            business: {
              base: 1600000,
              flexible: 1900000
            }
          },
          seats: {
            economy: { total: 150, available: 150, blocked: 0 },
            premiumEconomy: { total: 0, available: 0, blocked: 0 },
            business: { total: 8, available: 8, blocked: 0 },
            first: { total: 0, available: 0, blocked: 0 }
          },
          services: {
            meals: {
              available: true,
              types: [
                { type: 'normal', price: 0 }
              ]
            },
            baggage: {
              carryOn: {
                weight: 7,
                dimensions: '56x36x23cm'
              },
              checked: [
                { weight: 20, price: 0 },
                { weight: 30, price: 200000 }
              ]
            },
            entertainment: {
              wifi: { available: false },
              ife: false
            }
          },
          frequency: {
            isRegular: true,
            daysOfWeek: [1, 3, 5],
            seasonality: 'year_round'
          },
          metadata: {
            isActive: 'active'
          }
        });
      }
    }

    await Flight.insertMany(flights);
    console.log('Flights seeded successfully');
    console.log(`Created ${flights.length} flights`);

    // Create sample promotions
    const promotions = [
      {
        code: 'WELCOME50',
        name: 'Khuyến mãi chào mừng',
        description: 'Giảm 50% cho khách hàng mới',
        validity: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
        },
        discountType: 'percentage',
        discountValue: 50,
        maxDiscount: 500000,
        minSpend: 1000000,
        conditions: {
          userTypes: ['new_user'],
          minPassengers: 1,
          maxPassengers: 9
        },
        usage: {
          totalLimit: 1000,
          perUserLimit: 1
        },
        status: 'active'
      },
      {
        code: 'SUMMER2025',
        name: 'Khuyến mãi hè 2025',
        description: 'Giảm 30% tất cả chuyến bay trong mùa hè',
        validity: {
          startDate: new Date('2025-06-01'),
          endDate: new Date('2025-08-31'),
          travelPeriod: {
            from: new Date('2025-06-01'),
            to: new Date('2025-09-30')
          }
        },
        discountType: 'percentage',
        discountValue: 30,
        maxDiscount: 1000000,
        minSpend: 500000,
        usage: {
          totalLimit: 5000,
          perUserLimit: 3
        },
        status: 'active'
      }
    ];

    await Promotion.insertMany(promotions);
    console.log('Promotions seeded successfully');

    console.log('\n=== SEED DATA COMPLETED ===');
    console.log('Sample login credentials:');
    console.log('Email: test@vietjet.com');
    console.log('Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();