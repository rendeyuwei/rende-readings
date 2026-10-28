import { getCollection, type CollectionEntry } from 'astro:content';
import { categories, type CategoryName } from './categories';

export async function loadPosts(category?: CategoryName): Promise<CollectionEntry<'posts'>[]> {
  const posts = category
    ? await getCollection('posts', ({ data }) => data.category === category)
    : await getCollection('posts');
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function countCategories(posts: CollectionEntry<'posts'>[]): Record<string, number> {
  return Object.fromEntries(
    categories.map((category) => [
      category.slug,
      posts.filter((post) => post.data.category === category.name).length,
    ]),
  );
}
