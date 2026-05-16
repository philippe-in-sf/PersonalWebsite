import { defineField, defineType } from 'sanity';

function sectionCopy() {
  return [
    defineField({
      name: 'sectionLabel',
      title: 'Section label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ];
}

export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        ...sectionCopy(),
        defineField({
          name: 'dek',
          title: 'Deck',
          type: 'text',
          rows: 2,
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'intro',
          title: 'Intro',
          type: 'text',
          rows: 4,
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'profile',
      title: 'Profile',
      type: 'object',
      fields: [
        ...sectionCopy(),
        defineField({
          name: 'body1',
          title: 'Body 1',
          type: 'text',
          rows: 4,
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'body2',
          title: 'Body 2',
          type: 'text',
          rows: 3,
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'now',
      title: 'Now',
      type: 'object',
      fields: [
        ...sectionCopy(),
        defineField({
          name: 'body',
          title: 'Body',
          type: 'text',
          rows: 4,
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'writing',
      title: 'Writing',
      type: 'object',
      fields: [
        ...sectionCopy(),
        defineField({
          name: 'linkText',
          title: 'Link text',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'articles',
          title: 'Articles',
          type: 'array',
          of: [
            defineField({
              name: 'article',
              title: 'Article',
              type: 'object',
              fields: [
                defineField({
                  name: 'title',
                  title: 'Title',
                  type: 'string',
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: 'summary',
                  title: 'Summary',
                  type: 'text',
                  rows: 3,
                }),
                defineField({
                  name: 'url',
                  title: 'URL',
                  type: 'url',
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: 'publication',
                  title: 'Publication',
                  type: 'string',
                }),
                defineField({
                  name: 'publishedOn',
                  title: 'Published on',
                  type: 'date',
                }),
              ],
              preview: {
                select: {
                  title: 'title',
                  subtitle: 'publication',
                },
              },
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'contact',
      title: 'Contact',
      type: 'object',
      fields: [
        ...sectionCopy(),
        defineField({
          name: 'body',
          title: 'Body',
          type: 'text',
          rows: 4,
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'email',
          title: 'Email',
          type: 'email',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'linkedinUrl',
          title: 'LinkedIn URL',
          type: 'url',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'siteName',
      subtitle: 'hero.title',
    },
  },
});
