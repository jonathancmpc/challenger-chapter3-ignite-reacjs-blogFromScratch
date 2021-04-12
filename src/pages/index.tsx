import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';

import { getPrismicClient } from '../services/prismic';
import { FiCalendar, FiUser } from "react-icons/fi";

import styles from './home.module.scss';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Link from 'next/link';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleNewPagePosts() {
    const postsResponse = await fetch(nextPage)
      .then(response => response.json());

    const addNewPosts = postsResponse.results.map((post: Post) => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        }
      }
    })

    setPosts([...posts, ...addNewPosts]);
    setNextPage(postsResponse.next_page);
  }

  return(
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <Header />
      <section className={styles.containerPosts}>
        {posts.map(post => (
          <div key={ post.uid }>
            <Link href={`/post/${post.uid}`}>
              <a>
                <h1>{ post.data.title }</h1>
                <p>{ post.data.subtitle }</p>
              </a>
            </Link>
            <div className={styles.containerDetails}>
              <time>
                <FiCalendar size={18} /> 
                { 
                  format(new Date(post.first_publication_date ), "d LLL yyy", {
                    locale: ptBR,
                  })
                }
              </time>
              <span>
                <FiUser size={18}/>
                { post.data.author }
              </span>
            </div>
          </div>
        ))}
        
        {nextPage ?
          <a 
            onClick={handleNewPagePosts} 
            className={styles.loadingMore}
          >
            Carregar mais posts
          </a>
          :
          ''
        }

      </section>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {

  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ], {
    pageSize: 1,
  });

  const posts =  postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts
      }
    }
  }
};
