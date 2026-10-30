const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Expense Management API',
      version: '1.0.0',
      description: 'A comprehensive API for managing expenses and splitting them among users',
      contact: {
        name: 'API Support',
        email: 'support@expensemanager.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            name: {
              type: 'string',
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'User role'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp'
            }
          }
        },
        Expense: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Expense ID'
            },
            description: {
              type: 'string',
              description: 'Expense description'
            },
            total_amount: {
              type: 'number',
              format: 'decimal',
              description: 'Total expense amount'
            },
            created_by: {
              type: 'integer',
              description: 'ID of user who created the expense'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Expense creation timestamp'
            },
            splits: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ExpenseSplit'
              }
            }
          }
        },
        ExpenseSplit: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Split ID'
            },
            expense_id: {
              type: 'integer',
              description: 'Associated expense ID'
            },
            user_id: {
              type: 'integer',
              description: 'User ID for this split'
            },
            amount: {
              type: 'number',
              format: 'decimal',
              description: 'Split amount for this user'
            },
            user_name: {
              type: 'string',
              description: 'Name of user for this split'
            },
            user_email: {
              type: 'string',
              description: 'Email of user for this split'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            password: {
              type: 'string',
              description: 'User password'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string'
            },
            token: {
              type: 'string',
              description: 'JWT token'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        CreateUserRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            password: {
              type: 'string',
              description: 'User password'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              default: 'user',
              description: 'User role'
            }
          }
        },
        CreateExpenseRequest: {
          type: 'object',
          required: ['description', 'total_amount'],
          properties: {
            description: {
              type: 'string',
              description: 'Expense description'
            },
            total_amount: {
              type: 'number',
              format: 'decimal',
              description: 'Total expense amount'
            },
            splits: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  user_id: {
                    type: 'integer',
                    description: 'User ID for split'
                  },
                  amount: {
                    type: 'number',
                    format: 'decimal',
                    description: 'Amount for this user'
                  }
                }
              },
              description: 'Optional splits array. If not provided, expense will be assigned to creator'
            }
          }
        },
        SplitExpenseRequest: {
          type: 'object',
          required: ['splits'],
          properties: {
            splits: {
              type: 'array',
              items: {
                type: 'object',
                required: ['user_id', 'amount'],
                properties: {
                  user_id: {
                    type: 'integer',
                    description: 'User ID for split'
                  },
                  amount: {
                    type: 'number',
                    format: 'decimal',
                    description: 'Amount for this user'
                  }
                }
              },
              description: 'Array of splits. Total must equal expense amount'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
}; 