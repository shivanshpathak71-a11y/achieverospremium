// Diagnostic v4: Login once, then fetch SSR pages with auth cookies to extract __NEXT_DATA__
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const API_BASE = "https://parmaracademyapi.classx.co.in";
const SSR_BASE = "https://www.parmaracademy.in";

function extractNextData(html: string): any | null {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s,
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const results: any = {};

  // 1. Login
  const formData = new FormData();
  formData.append("source", "website");
  formData.append("email", "7078624464");
  formData.append("password", "Shiv@nsh1");

  const loginRes = await fetch(`${API_BASE}/post/userLogin?extra_details=1`, {
    method: "POST",
    body: formData,
    headers: {
      "Client-Service": "Appx",
      "Auth-Key": "appxapi",
      "source": "website",
    },
  });

  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  const userId = String(loginData.data?.userid || "");

  results.login = { userId, hasToken: !!token, status: loginData.status, message: loginData.message };

  if (!token) {
    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cookie = `appx_token=${token}; appx_userid=${userId}`;

  // 2. Fetch the main content page (lists subjects)
  const contentPageRes = await fetch(`${SSR_BASE}/courses/71/content?activeTab=Content`, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Cookie": cookie,
    },
    redirect: "manual",
  });
  const contentPageHtml = await contentPageRes.text();
  results.contentPage = {
    status: contentPageRes.status,
    redirect: contentPageRes.headers.get("location"),
  };

  const contentNextData = extractNextData(contentPageHtml);
  if (contentNextData) {
    const pageProps = contentNextData.props?.pageProps || {};
    results.contentPageProps = {
      statusCode: pageProps.statusCode,
      hasSubjects: !!pageProps.subjects,
      subjectsCount: pageProps.subjects?.length || 0,
    };
    if (pageProps.subjects && pageProps.subjects.length > 0) {
      results.subjects = pageProps.subjects.map((s: any) => {
        const keys = Object.keys(s);
        return {
          id: s.id || s.subjectid || s.subject_id,
          title: s.title || s.subject_name || s.name,
          slug: s.slug || s.subject_slug,
          keys: keys.slice(0, 15),
          raw: JSON.stringify(s).slice(0, 500),
        };
      });
    }
    if (pageProps.course) {
      results.courseKeys = Object.keys(pageProps.course).slice(0, 30);
    }
  } else {
    results.contentPagePreview = contentPageHtml.slice(0, 500);
  }

  // 3. If we have subjects, fetch the first subject's content page
  if (results.subjects && results.subjects.length > 0) {
    const firstSubject = results.subjects[0];
    const subjectId = firstSubject.id;
    if (subjectId) {
      const subjectPageRes = await fetch(`${SSR_BASE}/courses/71/content/${subjectId}`, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Cookie": cookie,
        },
        redirect: "manual",
      });
      const subjectPageHtml = await subjectPageRes.text();
      results.subjectPage = {
        status: subjectPageRes.status,
        subjectId,
      };

      const subjectNextData = extractNextData(subjectPageHtml);
      if (subjectNextData) {
        const pageProps = subjectNextData.props?.pageProps || {};
        results.subjectPageProps = {
          statusCode: pageProps.statusCode,
          hasChapters: !!pageProps.chapters,
          chaptersCount: pageProps.chapters?.length || 0,
        };
        if (pageProps.chapters && pageProps.chapters.length > 0) {
          results.chapters = pageProps.chapters.map((c: any) => {
            return {
              id: c.id || c.chapterid || c.chapter_id || c.topicid,
              title: c.title || c.chapter_name || c.name || c.topic_name,
              keys: Object.keys(c).slice(0, 20),
              raw: JSON.stringify(c).slice(0, 800),
            };
          }).slice(0, 5);
        }
      } else {
        results.subjectPagePreview = subjectPageHtml.slice(0, 500);
      }
    }
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
