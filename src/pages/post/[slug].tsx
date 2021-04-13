import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import Header from '../../components/Header';
import { FiCalendar, FiUser, FiClock} from 'react-icons/fi'
import { format } from 'date-fns';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import { ptBR } from 'date-fns/locale';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
 
  /* function readingText() {
    let sumText = 0
    for (let i = 0; i < post.data.content.length; i++) {
      const element = post.data.content[i];
      const split = element.body[0].text.split(" ").length;
      sumText += split ;
    }
    const avg = String(Math.ceil(sumText/200))

    return avg
  }   */

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));

    return total;
  }, 0);

  const readingTime = Math.ceil(totalWords / 200);

  if (router.isFallback) {
    return <h1>Carregando...</h1>
  }

  return (
    <>
      <Head>
        <title>Post | Ignews</title>
      </Head>

      <Header />

      <img src={post.data.banner.url} alt="banner"/>
      
      <main className={styles.containerMain}>

        <h1>{post.data.title}</h1>
        <div className={styles.containerDetails}>
          <time>
            <FiCalendar />
            { 
              format(new Date(post.first_publication_date ), "d LLL yyy", {
                locale: ptBR,
              })
            }
          </time>
          <span>
            <FiUser />
            {post.data.author}
          </span>
          <span>
            <FiClock />
            {/* {readingText()} min */}
            {`${readingTime} min`}
          </span>
        </div>

        <article className={styles.article}>
          {post.data.content.map(content => (
            <section key={content.heading}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </section>
          ))}
        </article>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {

  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ]);

  const uidPosts = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      }
    };
  });

  return {
    paths: uidPosts,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async context => {
  
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    data: {
      author: response.data.author,
      title: response.data.title,
      subtitle: response.data.subtitle,
      content: response.data.content.map(item => ({
        heading: item.heading,
        body: [...item.body],
      })),
      banner: {
        url: response.data.banner.url,
      },
    },
    uid: response.uid,
    first_publication_date: response.first_publication_date,
  };

  return {
    props: {
      post
    },
    redirect: 60 * 30,
  }
};