import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Aurea CRM API',
        version: '1.0.0',
        description: 'API do Aurea CRM - Gestão de Contatos, Pipeline e Comunicações',
        contact: {
          name: 'Suporte',
          email: 'suporte@aurea.com',
        },
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
          description: 'Servidor local',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          Tag: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              organizationId: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              color: { type: 'string' },
              description: { type: 'string', nullable: true },
              source: { type: 'string', enum: ['manual', 'automation', 'utm'] },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              _count: {
                type: 'object',
                properties: {
                  contactTags: { type: 'integer', description: 'Número de contatos com esta tag' }
                }
              },
            },
          },
          List: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              organizationId: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              filters: { type: 'object' },
              isDynamic: { type: 'boolean' },
              contactCount: { type: 'integer' },
              createdBy: { type: 'string', format: 'uuid', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          CustomFieldDefinition: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              organizationId: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              key: { type: 'string' },
              description: { type: 'string', nullable: true },
              type: { type: 'string', enum: ['text', 'number', 'date', 'select', 'multiselect', 'boolean'] },
              required: { type: 'boolean' },
              options: { type: 'array', items: { type: 'object' } },
              displayOrder: { type: 'integer' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          Segment: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              organizationId: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              rules: { type: 'array', items: { type: 'object' } },
              contactCount: { type: 'integer' },
              lastCalculatedAt: { type: 'string', format: 'date-time', nullable: true },
              createdBy: { type: 'string', format: 'uuid', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          Contact: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              organizationId: { type: 'string', format: 'uuid' },
              phone: { type: 'string' },
              name: { type: 'string', nullable: true },
              avatarUrl: { type: 'string', nullable: true },
              metadata: { type: 'object', nullable: true },
              tags: { type: 'array', items: { type: 'string' } },
              leadScore: { type: 'integer' },
              status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'] },
              lastInteractionAt: { type: 'string', format: 'date-time', nullable: true },
              deletedAt: { type: 'string', format: 'date-time', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          Error: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
          },
          PaginationResponse: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              limit: { type: 'integer' },
              offset: { type: 'integer' },
              hasMore: { type: 'boolean' },
            },
          },
        },
      },
      tags: [
        { name: 'Tags', description: 'Gerenciamento de tags de contatos' },
        { name: 'Lists', description: 'Gerenciamento de listas de contatos' },
        { name: 'Custom Fields', description: 'Gerenciamento de campos customizados' },
        { name: 'Segments', description: 'Gerenciamento de segmentos de contatos' },
        { name: 'Contacts', description: 'Gerenciamento de contatos' },
        { name: 'Pipeline', description: 'Gerenciamento de pipeline e deals' },
        { name: 'WhatsApp', description: 'Integração com WhatsApp Business API' },
        { name: 'Instagram', description: 'Integração com Instagram' },
        { name: 'Auth', description: 'Autenticação e autorização' },
      ],
    },
  });
  return spec;
};
