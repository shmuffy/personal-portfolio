export interface PostFrontmatter {
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  published: boolean;
  coverImage?: string;
}

export interface Post extends PostFrontmatter {
  slug: string;
  readingTime: string;
  content: string;
}
