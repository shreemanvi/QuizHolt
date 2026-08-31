import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Library, BarChart2, Users, Settings, Heart, Plus,
  Play, Search, Edit3, Trash2, Copy, Sparkles, Folder, CheckCircle,
  ChevronLeft, Save, Check, Sun, Moon, Monitor, X, Loader2,
  ListChecks, CircleDot, Trophy, Zap, Target, BookOpen, Clock3
} from 'lucide-react';
import './App.css';

const API_BASE = 'https://quizholt-backend.onrender.com/api/quizzes';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const cardVariant = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
};

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

const normalizeQuestion = (q) => ({
  ...q,
  answerType: q.answerType === 'multiple' ? 'multiple' : 'single',

  correctOptionIndices: Array.isArray(q.correctOptionIndices)
    ? q.correctOptionIndices
    : [
        typeof q.correctOptionIndex === 'number'
          ? q.correctOptionIndex
          : 0
      ],

  correctOptionIndex:
    typeof q.correctOptionIndex === 'number'
      ? q.correctOptionIndex
      : (
          Array.isArray(q.correctOptionIndices)
            ? q.correctOptionIndices[0]
            : 0
        )
});

const normalizeQuiz = (quiz) => ({
  ...quiz,
  questions: (quiz.questions || []).map(normalizeQuestion)
});

export default function App() {
  const [view, setView] = useState('dashboard');

  const [theme, setTheme] = useState(
    localStorage.getItem('quizholt_theme') || 'system'
  );

  const [quizzes, setQuizzes] = useState([]);

  const [favorites, setFavorites] = useState(
    JSON.parse(localStorage.getItem('quizholt_favs')) || []
  );

  const [attempts, setAttempts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'quizholt_favs',
      JSON.stringify(favorites)
    );
  }, [favorites]);

  /*
   * Decorative background movement is deliberately independent
   * of the mouse.
   *
   * It gently moves with scrolling but DOES NOT follow the cursor.
   */
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;

      requestAnimationFrame(() => {
        const y = window.scrollY || 0;

        document.documentElement.style.setProperty(
          '--scroll-shift',
          `${Math.min(y * 0.04, 35)}px`
        );

        ticking = false;
      });
    };

    window.addEventListener(
      'scroll',
      handleScroll,
      { passive: true }
    );

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll
      );
    };
  }, []);

  const applyTheme = (selectedTheme) => {
    let resolvedTheme = selectedTheme;

    if (selectedTheme === 'system') {
      resolvedTheme =
        window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches
          ? 'dark'
          : 'light';
    }

    document.documentElement.setAttribute(
      'data-theme',
      resolvedTheme
    );

    localStorage.setItem(
      'quizholt_theme',
      selectedTheme
    );
  };

  const loadQuizzes = async () => {
    try {
      const res = await axios.get(API_BASE);

      setQuizzes(
        (res.data || []).map(normalizeQuiz)
      );
    } catch (e) {
      /*
       * Keep the UI usable if backend is temporarily unavailable.
       */
    }
  };

  const showToast = (msg) => {
    setToast(msg);

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const navigate = (newView, quizData = null) => {
    setActiveQuiz(
      quizData
        ? normalizeQuiz(quizData)
        : null
    );

    setSearchQuery('');
    setView(newView);

    /*
     * Prevent a stale caret/focus from visually remaining
     * when changing screens.
     */
    if (
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur();
    }
  };

  const toggleFavorite = (e, id) => {
    e.stopPropagation();

    if (favorites.includes(id)) {
      setFavorites(
        favorites.filter(
          f => f !== id
        )
      );

      showToast(
        'Removed from favorites'
      );
    } else {
      setFavorites([
        ...favorites,
        id
      ]);

      showToast(
        'Added to favorites'
      );
    }
  };

  const deleteQuiz = async (e, id) => {
    e.stopPropagation();

    if (
      window.confirm(
        'Are you sure you want to delete this quiz?'
      )
    ) {
      try {
        await axios.delete(
          `${API_BASE}/${id}`
        );
      } catch (e) {}

      setQuizzes(
        prev =>
          prev.filter(
            q => q.id !== id
          )
      );

      setFavorites(
        prev =>
          prev.filter(
            f => f !== id
          )
      );

      showToast(
        'Quiz deleted'
      );
    }
  };

  const duplicateQuiz = (e, quiz) => {
    e.stopPropagation();

    const copy = {
      ...normalizeQuiz(quiz),
      id: Date.now().toString(),
      title: `${quiz.title} (Copy)`,
      status: 'Draft'
    };

    setQuizzes(
      prev => [
        copy,
        ...prev
      ]
    );

    showToast(
      'Quiz duplicated'
    );
  };

  const handleCreateNew = () => {
    const now = Date.now();

    const newQuiz = {
      id: now.toString(),

      title: '',

      questions: [
        {
          id: now,
          questionText: '',
          options: [
            '',
            '',
            '',
            ''
          ],

          answerType: 'single',

          correctOptionIndex: 0,

          correctOptionIndices: [
            0
          ]
        }
      ],

      status: 'Draft',

      updatedAt:
        new Date().toLocaleDateString()
    };

    navigate(
      'builder',
      newQuiz
    );
  };

  const saveQuiz = async (
    updatedQuiz,
    publish = false
  ) => {
    const quizToSave = {
      ...updatedQuiz,

      status:
        publish
          ? 'Published'
          : (
              updatedQuiz.status ||
              'Draft'
            ),

      updatedAt:
        new Date().toLocaleDateString(),

      questions:
        updatedQuiz.questions.map(
          normalizeQuestion
        )
    };

    try {
      await axios.post(
        API_BASE,
        quizToSave
      );
    } catch (e) {}

    setQuizzes(prev => {
      const exists =
        prev.find(
          q =>
            q.id ===
            quizToSave.id
        );

      if (exists) {
        return prev.map(
          q =>
            q.id ===
            quizToSave.id
              ? quizToSave
              : q
        );
      }

      return [
        quizToSave,
        ...prev
      ];
    });

    showToast(
      publish
        ? 'Quiz Published!'
        : 'Draft Saved'
    );

    if (publish) {
      navigate('library');
    }
  };

  const filteredQuizzes =
    quizzes.filter(q =>
      (q.title || '')
        .toLowerCase()
        .includes(
          searchQuery.toLowerCase()
        )
    );

  const favQuizzes =
    quizzes.filter(
      q =>
        favorites.includes(
          q.id
        )
    );

  const publishedCount =
    quizzes.filter(
      q =>
        q.status ===
        'Published'
    ).length;

  const draftCount =
    quizzes.filter(
      q =>
        q.status ===
        'Draft'
    ).length;

  const totalQuestions =
    quizzes.reduce(
      (sum, q) =>
        sum +
        (q.questions?.length || 0),
      0
    );

  const greeting =
    new Date().getHours() < 12
      ? 'Good morning'
      : new Date().getHours() < 18
        ? 'Good afternoon'
        : 'Good evening';

  return (
  <div className="app-shell">

    <CustomCursor />

      <BackgroundPattern />

      <div className="app-layout">

        {view !== 'builder' &&
          view !== 'player' && (

          <aside className="sidebar">

            <div className="brand">
              <div className="brand-icon">
                <Sparkles size={20} />
              </div>

              <span>
                Quiz Holt
              </span>
            </div>

            <div className="nav-section">

              <motion.button
                whileHover={{
                  x: 4
                }}
                whileTap={{
                  scale: 0.98
                }}
                className={`nav-item ${
                  view === 'dashboard'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  navigate(
                    'dashboard'
                  )
                }
              >
                <LayoutDashboard
                  size={18}
                />

                Dashboard
              </motion.button>

              <motion.button
                whileHover={{
                  x: 4
                }}
                whileTap={{
                  scale: 0.98
                }}
                className={`nav-item ${
                  view === 'library'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  navigate(
                    'library'
                  )
                }
              >
                <Library
                  size={18}
                />

                My Quizzes
              </motion.button>

            </div>

            <div className="nav-section">

              <span className="nav-section-title">
                Insights
              </span>

              <motion.button
                whileHover={{
                  x: 4
                }}
                whileTap={{
                  scale: 0.98
                }}
                className={`nav-item ${
                  view === 'analytics'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  navigate(
                    'analytics'
                  )
                }
              >
                <BarChart2
                  size={18}
                />

                Analytics
              </motion.button>

              <motion.button
                whileHover={{
                  x: 4
                }}
                whileTap={{
                  scale: 0.98
                }}
                className={`nav-item ${
                  view === 'participants'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  navigate(
                    'participants'
                  )
                }
              >
                <Users
                  size={18}
                />

                Participants
              </motion.button>

            </div>

            <div className="nav-section sidebar-bottom">

              <motion.button
                whileHover={{
                  x: 4
                }}
                whileTap={{
                  scale: 0.98
                }}
                className={`nav-item ${
                  view === 'favorites'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  navigate(
                    'favorites'
                  )
                }
              >
                <Heart
                  size={18}
                />

                Favorites
              </motion.button>

              <motion.button
                whileHover={{
                  x: 4
                }}
                whileTap={{
                  scale: 0.98
                }}
                className={`nav-item ${
                  view === 'settings'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  navigate(
                    'settings'
                  )
                }
              >
                <Settings
                  size={18}
                />

                Settings
              </motion.button>

            </div>

          </aside>
        )}

        <main
          className="main-content"
          style={{
            maxWidth:
              view === 'player' ||
              view === 'builder'
                ? '100%'
                : '1400px'
          }}
        >

          <AnimatePresence>

            {toast && (

              <motion.div
                initial={{
                  opacity: 0,
                  y: 30,
                  scale: 0.94
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1
                }}
                exit={{
                  opacity: 0,
                  y: 15,
                  scale: 0.96
                }}
                className="toast"
              >

                <CheckCircle
                  size={18}
                />

                {toast}

              </motion.div>
            )}

          </AnimatePresence>

          <AnimatePresence mode="wait">

            {view === 'dashboard' && (

              <motion.div
                key="dashboard"
                variants={
                  staggerContainer
                }
                initial="hidden"
                animate="show"
                exit="exit"
              >

                <motion.div
                  variants={
                    cardVariant
                  }
                  className="page-header dashboard-header"
                >

                  <div>

                    <div className="eyebrow">
                      <Sparkles
                        size={13}
                      />

                      QUIZ HOLT
                    </div>

                    <h1>
                      {greeting}, Manvi 👋
                    </h1>

                    <p>
                      Create, share, and
                      play interactive
                      quizzes.
                    </p>

                  </div>

                  <motion.button
                    whileHover={{
                      scale: 1.04,
                      y: -2
                    }}
                    whileTap={{
                      scale: 0.96
                    }}
                    className="btn btn-primary"
                    onClick={
                      handleCreateNew
                    }
                  >
                    <Plus
                      size={18}
                    />

                    Create Quiz
                  </motion.button>

                </motion.div>

                <motion.div
                  variants={
                    cardVariant
                  }
                  className="dashboard-hero"
                >

                  <div className="hero-copy">

                    <span className="hero-kicker">
                      <Zap
                        size={14}
                      />

                      READY TO PLAY?
                    </span>

                    <h2>
                      Turn your ideas
                      into a quiz.
                    </h2>

                    <p>
                      Build engaging
                      questions, choose
                      single or multiple
                      answers, and let
                      participants jump in.
                    </p>

                    <button
                      className="hero-link"
                      onClick={
                        handleCreateNew
                      }
                    >
                      <Plus
                        size={16}
                      />

                      Start creating
                    </button>

                  </div>

                  <div className="hero-orbit">

                    <div className="orbit orbit-one" />
                    <div className="orbit orbit-two" />

                    <motion.div
                      animate={{
                        y: [
                          -6,
                          8,
                          -6
                        ],
                        rotate: [
                          -2,
                          2,
                          -2
                        ]
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                      className="hero-icon-card"
                    >
                      <Sparkles
                        size={34}
                      />
                    </motion.div>

                    <div className="hero-mini-card hero-mini-one">
                      <Target
                        size={16}
                      />

                      <span>
                        Interactive
                      </span>
                    </div>

                    <div className="hero-mini-card hero-mini-two">
                      <ListChecks
                        size={16}
                      />

                      <span>
                        Multi-answer
                      </span>
                    </div>

                  </div>

                </motion.div>

                <motion.div
                  variants={
                    cardVariant
                  }
                  className="grid-4 dashboard-stats"
                >

                  <StatCard
                    icon={
                      <BookOpen
                        size={19}
                      />
                    }
                    label="Total Quizzes"
                    value={
                      quizzes.length
                    }
                  />

                  <StatCard
                    icon={
                      <Play
                        size={19}
                      />
                    }
                    label="Published"
                    value={
                      publishedCount
                    }
                  />

                  <StatCard
                    icon={
                      <Edit3
                        size={19}
                      />
                    }
                    label="Drafts"
                    value={
                      draftCount
                    }
                  />

                  <StatCard
                    icon={
                      <Heart
                        size={19}
                      />
                    }
                    label="Favorites"
                    value={
                      favorites.length
                    }
                  />

                </motion.div>

                <motion.div
                  variants={
                    cardVariant
                  }
                  className="quick-info-row"
                >

                  <div className="quick-info-card">
                    <div className="quick-info-icon">
                      <ListChecks
                        size={18}
                      />
                    </div>

                    <div>
                      <strong>
                        {totalQuestions}
                      </strong>

                      <span>
                        Questions created
                      </span>
                    </div>
                  </div>

                  <div className="quick-info-card">
                    <div className="quick-info-icon">
                      <Heart
                        size={18}
                      />
                    </div>

                    <div>
                      <strong>
                        {favQuizzes.length}
                      </strong>

                      <span>
                        Saved favorites
                      </span>
                    </div>
                  </div>

                  <div className="quick-info-card">
                    <div className="quick-info-icon">
                      <Clock3
                        size={18}
                      />
                    </div>

                    <div>
                      <strong>
                        {quizzes.length
                          ? 'Active'
                          : 'Ready'}
                      </strong>

                      <span>
                        Library status
                      </span>
                    </div>
                  </div>

                </motion.div>

                <motion.div
                  variants={
                    cardVariant
                  }
                  className="section-heading"
                >

                  <div>
                    <span className="eyebrow">
                      YOUR LIBRARY
                    </span>

                    <h3>
                      Recent Quizzes
                    </h3>
                  </div>

                  {quizzes.length > 0 && (

                    <motion.button
                      whileHover={{
                        x: 3
                      }}
                      className="text-button"
                      onClick={() =>
                        navigate(
                          'library'
                        )
                      }
                    >
                      View all
                      <ChevronLeft
                        size={16}
                        className="rotate-180"
                      />
                    </motion.button>

                  )}

                </motion.div>

                {quizzes.length === 0 ? (

                  <motion.div
                    variants={
                      cardVariant
                    }
                  >
                    <EmptyState
                      icon={
                        <Folder
                          size={32}
                        />
                      }
                      title="Your library is waiting"
                      desc="Create your first quiz to get started."
                      action={{
                        label:
                          'Create Quiz',
                        onClick:
                          handleCreateNew
                      }}
                    />
                  </motion.div>

                ) : (

                  <motion.div
                    variants={
                      staggerContainer
                    }
                    className="grid-cards"
                  >

                    {quizzes
                      .slice(0, 3)
                      .map(
                        quiz => (

                          <QuizCard
                            key={
                              quiz.id
                            }
                            quiz={
                              quiz
                            }
                            isFav={
                              favorites.includes(
                                quiz.id
                              )
                            }
                            onToggleFav={
                              toggleFavorite
                            }
                            onPlay={() =>
                              navigate(
                                'player',
                                quiz
                              )
                            }
                            onEdit={() =>
                              navigate(
                                'builder',
                                quiz
                              )
                            }
                            onDup={
                              duplicateQuiz
                            }
                            onDel={
                              deleteQuiz
                            }
                          />

                        )
                      )}

                  </motion.div>
                )}

              </motion.div>
            )}

            {view === 'library' && (

              <motion.div
                key="library"
                variants={
                  staggerContainer
                }
                initial="hidden"
                animate="show"
                exit="exit"
              >

                <motion.div
                  variants={
                    cardVariant
                  }
                  className="page-header"
                >

                  <div>
                    <div className="eyebrow">
                      <Library
                        size={13}
                      />
                      LIBRARY
                    </div>

                    <h1>
                      My Quizzes
                    </h1>

                    <p>
                      Manage everything
                      you've created.
                    </p>
                  </div>

                  <div className="library-actions">

                    <div className="search-bar">
                      <Search
                        size={18}
                      />

                      <input
                        placeholder="Search quizzes..."
                        value={
                          searchQuery
                        }
                        onChange={
                          e =>
                            setSearchQuery(
                              e.target.value
                            )
                        }
                      />
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={
                        handleCreateNew
                      }
                    >
                      <Plus
                        size={17}
                      />

                      Create
                    </button>

                  </div>

                </motion.div>

                {filteredQuizzes.length === 0 ? (

                  <motion.div
                    variants={
                      cardVariant
                    }
                  >
                    <EmptyState
                      icon={
                        <Search
                          size={32}
                        />
                      }
                      title="No quizzes found"
                      desc="Adjust your search or create a new quiz."
                      action={
                        quizzes.length === 0
                          ? {
                              label:
                                'Create Quiz',
                              onClick:
                                handleCreateNew
                            }
                          : null
                      }
                    />
                  </motion.div>

                ) : (

                  <motion.div
                    variants={
                      staggerContainer
                    }
                    className="grid-cards"
                  >

                    {filteredQuizzes.map(
                      quiz => (

                        <QuizCard
                          key={
                            quiz.id
                          }
                          quiz={
                            quiz
                          }
                          isFav={
                            favorites.includes(
                              quiz.id
                            )
                          }
                          onToggleFav={
                            toggleFavorite
                          }
                          onPlay={() =>
                            navigate(
                              'player',
                              quiz
                            )
                          }
                          onEdit={() =>
                            navigate(
                              'builder',
                              quiz
                            )
                          }
                          onDup={
                            duplicateQuiz
                          }
                          onDel={
                            deleteQuiz
                          }
                        />

                      )
                    )}

                  </motion.div>
                )}

              </motion.div>
            )}

            {view === 'favorites' && (

              <motion.div
                key="favorites"
                variants={
                  staggerContainer
                }
                initial="hidden"
                animate="show"
                exit="exit"
              >

                <motion.div
                  variants={
                    cardVariant
                  }
                  className="page-header"
                >

                  <div>
                    <div className="eyebrow">
                      <Heart
                        size={13}
                      />
                      SAVED
                    </div>

                    <h1>
                      Favorites
                    </h1>

                    <p>
                      Your saved quizzes,
                      all in one place.
                    </p>
                  </div>

                </motion.div>

                {favQuizzes.length === 0 ? (

                  <EmptyState
                    icon={
                      <Heart
                        size={32}
                      />
                    }
                    title="No favorites yet"
                    desc="Tap the heart on any quiz to save it here."
                    action={{
                      label:
                        'Browse Quizzes',
                      onClick: () =>
                        navigate(
                          'library'
                        )
                    }}
                  />

                ) : (

                  <motion.div
                    variants={
                      staggerContainer
                    }
                    className="grid-cards"
                  >

                    {favQuizzes.map(
                      quiz => (

                        <QuizCard
                          key={
                            quiz.id
                          }
                          quiz={
                            quiz
                          }
                          isFav={
                            true
                          }
                          onToggleFav={
                            toggleFavorite
                          }
                          onPlay={() =>
                            navigate(
                              'player',
                              quiz
                            )
                          }
                          onEdit={() =>
                            navigate(
                              'builder',
                              quiz
                            )
                          }
                          onDup={
                            duplicateQuiz
                          }
                          onDel={
                            deleteQuiz
                          }
                        />

                      )
                    )}

                  </motion.div>
                )}

              </motion.div>
            )}

            {view === 'settings' && (

              <motion.div
                key="settings"
                variants={
                  staggerContainer
                }
                initial="hidden"
                animate="show"
                exit="exit"
              >

                <motion.div
                  variants={
                    cardVariant
                  }
                  className="page-header"
                >

                  <div>
                    <div className="eyebrow">
                      <Settings
                        size={13}
                      />
                      PREFERENCES
                    </div>

                    <h1>
                      Settings
                    </h1>

                    <p>
                      Make Quiz Holt feel
                      like yours.
                    </p>
                  </div>

                </motion.div>

                <motion.div
                  variants={
                    cardVariant
                  }
                  className="settings-grid"
                >

                  <div className="card settings-card">

                    <div className="settings-title">
                      <div className="settings-title-icon">
                        <Sparkles
                          size={19}
                        />
                      </div>

                      <div>
                        <h3>
                          Appearance
                        </h3>

                        <p>
                          Choose your preferred
                          interface theme.
                        </p>
                      </div>
                    </div>

                    <div className="theme-options">

                      <ThemeCard
                        icon={
                          <Sun
                            size={23}
                          />
                        }
                        label="Light"
                        description="Bright & clean"
                        active={
                          theme ===
                          'light'
                        }
                        onClick={() =>
                          setTheme(
                            'light'
                          )
                        }
                      />

                      <ThemeCard
                        icon={
                          <Moon
                            size={23}
                          />
                        }
                        label="Dark"
                        description="Neon & focused"
                        active={
                          theme ===
                          'dark'
                        }
                        onClick={() =>
                          setTheme(
                            'dark'
                          )
                        }
                      />

                      <ThemeCard
                        icon={
                          <Monitor
                            size={23}
                          />
                        }
                        label="System"
                        description="Match device"
                        active={
                          theme ===
                          'system'
                        }
                        onClick={() =>
                          setTheme(
                            'system'
                          )
                        }
                      />

                    </div>

                  </div>

                  <div className="card settings-side-card">

                    <div className="settings-side-icon">
                      <Zap
                        size={21}
                      />
                    </div>

                    <h3>
                      Quiz Holt
                    </h3>

                    <p>
                      Built for quick,
                      interactive quiz
                      creation without
                      unnecessary clutter.
                    </p>

                    <div className="settings-feature">
                      <Check
                        size={15}
                      />
                      Smooth interactions
                    </div>

                    <div className="settings-feature">
                      <Check
                        size={15}
                      />
                      Single & multi-answer
                    </div>

                    <div className="settings-feature">
                      <Check
                        size={15}
                      />
                      Light & dark themes
                    </div>

                  </div>

                </motion.div>

              </motion.div>
            )}

            {view === 'analytics' && (

              <AnalyticsPage
                quizzes={quizzes}
                attempts={attempts}
                onBack={() =>
                  navigate(
                    'dashboard'
                  )
                }
              />

            )}

            {view === 'participants' && (

              <ParticipantsPage
                quizzes={quizzes}
                attempts={attempts}
                onBack={() =>
                  navigate(
                    'dashboard'
                  )
                }
              />

            )}

            {view === 'builder' &&
              activeQuiz && (

                <QuizBuilder
                  initialQuiz={
                    activeQuiz
                  }
                  onBack={() =>
                    navigate(
                      'dashboard'
                    )
                  }
                  onSave={
                    saveQuiz
                  }
                />

            )}

            {view === 'player' &&
              activeQuiz && (

                <QuizPlayer
                  quiz={
                    activeQuiz
                  }
                  onExit={() =>
                    navigate(
                      'dashboard'
                    )
                  }
                  onComplete={
                    score =>
                      setAttempts(
                        prev => [
                          ...prev,
                          {
                            quizId:
                              activeQuiz.id,
                            score
                          }
                        ]
                      )
                  }
                />

            )}

          </AnimatePresence>

        </main>

      </div>

    </div>
  );
}

function BackgroundPattern() {
  return (
    <div
      className="background-pattern"
      aria-hidden="true"
    >

      <div className="grid-pattern" />

      <div className="dot-pattern" />

      <motion.div
        className="ambient-shape shape-one"
        animate={{
          y: [
            0,
            -20,
            0
          ],
          rotate: [
            0,
            8,
            0
          ]
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      <motion.div
        className="ambient-shape shape-two"
        animate={{
          y: [
            0,
            25,
            0
          ],
          rotate: [
            0,
            -10,
            0
          ]
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      <motion.div
        className="ambient-shape shape-three"
        animate={{
          y: [
            0,
            -14,
            0
          ],
          x: [
            0,
            12,
            0
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

    </div>
  );
}

function StatCard({
  icon,
  label,
  value
}) {
  return (
    <motion.div
      whileHover={{
        y: -4
      }}
      className="card stat-card"
    >

      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <div className="stat-label">
          {label}
        </div>

        <div className="stat-value">
          {value}
        </div>
      </div>

    </motion.div>
  );
}

function ThemeCard({
  icon,
  label,
  description,
  active,
  onClick
}) {
  return (
    <motion.button
      type="button"
      whileHover={{
        y: -3
      }}
      whileTap={{
        scale: 0.98
      }}
      className={`theme-card ${
        active
          ? 'active'
          : ''
      }`}
      onClick={
        onClick
      }
    >

      <div className="theme-card-icon">
        {icon}
      </div>

      <strong>
        {label}
      </strong>

      <span>
        {description}
      </span>

      {active && (
        <div className="theme-check">
          <Check
            size={13}
          />
        </div>
      )}

    </motion.button>
  );
}

function EmptyState({
  icon,
  title,
  desc,
  action
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      className="empty-state"
    >

      <div className="empty-icon">
        {icon}
      </div>

      <h3 className="empty-title">
        {title}
      </h3>

      <p className="empty-desc">
        {desc}
      </p>

      {action && (

        <motion.button
          whileHover={{
            scale: 1.04,
            y: -2
          }}
          whileTap={{
            scale: 0.96
          }}
          className="btn btn-primary"
          onClick={
            action.onClick
          }
        >
          <Plus
            size={17}
          />

          {action.label}
        </motion.button>

      )}

    </motion.div>
  );
}

function QuizCard({
  quiz,
  isFav,
  onToggleFav,
  onPlay,
  onEdit,
  onDup,
  onDel
}) {
  const questionCount =
    quiz.questions?.length ||
    0;

  const multipleCount =
    quiz.questions?.filter(
      q =>
        q.answerType ===
        'multiple'
    ).length || 0;

  return (
    <motion.div
      variants={
        cardVariant
      }
      whileHover={{
        y: -5
      }}
      className="card quiz-card"
    >

      <div className="quiz-card-glow" />

      <div className="quiz-card-top">

        <div className="quiz-card-title-area">

          <span
            className={`badge ${
              quiz.status ===
              'Published'
                ? 'badge-published'
                : 'badge-draft'
            }`}
          >
            {quiz.status}
          </span>

          <h3>
            {quiz.title ||
              'Untitled Quiz'}
          </h3>

          <div className="quiz-meta">
            <span>
              <ListChecks
                size={14}
              />

              {questionCount}{' '}
              Questions
            </span>

            {multipleCount > 0 && (
              <span>
                <CircleDot
                  size={13}
                />

                {multipleCount}{' '}
                Multi
              </span>
            )}
          </div>

        </div>

        <motion.button
          whileHover={{
            scale: 1.12
          }}
          whileTap={{
            scale: 0.85
          }}
          className={`btn-icon ${
            isFav
              ? 'active'
              : ''
          }`}
          onClick={e =>
            onToggleFav(
              e,
              quiz.id
            )
          }
          aria-label="Favorite quiz"
        >

          <Heart
            size={20}
            fill={
              isFav
                ? 'currentColor'
                : 'none'
            }
          />

        </motion.button>

      </div>

      <div className="quiz-card-footer">

        {quiz.status ===
          'Published' && (

          <motion.button
            whileHover={{
              scale: 1.03
            }}
            whileTap={{
              scale: 0.96
            }}
            className="btn btn-primary"
            onClick={
              onPlay
            }
          >
            <Play
              size={15}
              fill="currentColor"
            />

            Play
          </motion.button>

        )}

        <motion.button
          whileHover={{
            scale: 1.03
          }}
          whileTap={{
            scale: 0.96
          }}
          className="btn btn-secondary"
          onClick={
            onEdit
          }
        >
          <Edit3
            size={15}
          />

          Edit
        </motion.button>

        <motion.button
          whileHover={{
            scale: 1.08
          }}
          whileTap={{
            scale: 0.9
          }}
          className="btn-icon"
          onClick={e =>
            onDup(
              e,
              quiz
            )
          }
          title="Duplicate"
        >
          <Copy
            size={16}
          />
        </motion.button>

        <motion.button
          whileHover={{
            scale: 1.08
          }}
          whileTap={{
            scale: 0.9
          }}
          className="btn-icon danger"
          onClick={e =>
            onDel(
              e,
              quiz.id
            )
          }
          title="Delete"
        >
          <Trash2
            size={16}
          />
        </motion.button>

      </div>

    </motion.div>
  );
}

function AnalyticsPage({
  quizzes,
  attempts,
  onBack
}) {
  const totalAttempts =
    attempts.length;

  const averageScore =
    attempts.length
      ? Math.round(
          attempts.reduce(
            (sum, a) =>
              sum + a.score,
            0
          ) /
          attempts.length
        )
      : 0;

  return (
    <motion.div
      {...pageTransition}
    >

      <div className="page-header">

        <div>
          <div className="eyebrow">
            <BarChart2
              size={13}
            />

            INSIGHTS
          </div>

          <h1>
            Analytics
          </h1>

          <p>
            A quick overview of
            your quiz activity.
          </p>
        </div>

      </div>

      <div className="analytics-grid">

        <div className="card analytics-main">

          <div className="analytics-header">
            <div>
              <h3>
                Quiz activity
              </h3>

              <p>
                Your current library
                at a glance.
              </p>
            </div>

            <div className="analytics-big-number">
              {quizzes.length}
            </div>
          </div>

          <div className="analytics-bars">

            <AnalyticsBar
              label="Published"
              value={
                quizzes.filter(
                  q =>
                    q.status ===
                    'Published'
                ).length
              }
              total={
                Math.max(
                  quizzes.length,
                  1
                )
              }
            />

            <AnalyticsBar
              label="Drafts"
              value={
                quizzes.filter(
                  q =>
                    q.status ===
                    'Draft'
                ).length
              }
              total={
                Math.max(
                  quizzes.length,
                  1
                )
              }
            />

          </div>

        </div>

        <div className="card analytics-side">

          <div className="analytics-stat">
            <Trophy
              size={20}
            />

            <div>
              <strong>
                {totalAttempts}
              </strong>

              <span>
                Attempts recorded
              </span>
            </div>
          </div>

          <div className="analytics-stat">
            <Target
              size={20}
            />

            <div>
              <strong>
                {averageScore}
              </strong>

              <span>
                Average score
              </span>
            </div>
          </div>

        </div>

      </div>

      <button
        className="btn btn-secondary"
        onClick={
          onBack
        }
      >
        <ChevronLeft
          size={17}
        />

        Back to Dashboard
      </button>

    </motion.div>
  );
}

function AnalyticsBar({
  label,
  value,
  total
}) {
  const percentage =
    Math.round(
      (value / total) *
      100
    );

  return (
    <div className="analytics-bar-row">

      <div className="analytics-bar-label">
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>

      <div className="analytics-bar-bg">

        <motion.div
          initial={{
            width: 0
          }}
          animate={{
            width:
              `${percentage}%`
          }}
          transition={{
            duration: 0.8
          }}
          className="analytics-bar-fill"
        />

      </div>

    </div>
  );
}

function ParticipantsPage({
  quizzes,
  attempts,
  onBack
}) {
  return (
    <motion.div
      {...pageTransition}
    >

      <div className="page-header">

        <div>
          <div className="eyebrow">
            <Users
              size={13}
            />

            LIVE DATA
          </div>

          <h1>
            Participants
          </h1>

          <p>
            Participant activity will
            appear here as live quizzes
            are played.
          </p>
        </div>

      </div>

      <div className="card participant-empty">

        <div className="participant-icon">
          <Users
            size={27}
          />
        </div>

        <h2>
          Ready for participants
        </h2>

        <p>
          Publish a quiz and start
          collecting participant
          activity.
        </p>

        <div className="participant-mini-stats">

          <div>
            <strong>
              {quizzes.length}
            </strong>

            <span>
              Quizzes
            </span>
          </div>

          <div>
            <strong>
              {attempts.length}
            </strong>

            <span>
              Attempts
            </span>
          </div>

        </div>

        <button
          className="btn btn-secondary"
          onClick={
            onBack
          }
        >
          <ChevronLeft
            size={17}
          />

          Back to Dashboard
        </button>

      </div>

    </motion.div>
  );
}

function QuizBuilder({
  initialQuiz,
  onBack,
  onSave
}) {
  const [quiz, setQuiz] =
    useState(
      normalizeQuiz(
        initialQuiz
      )
    );

  const [saving, setSaving] =
    useState(false);

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      questionText: '',
      options: [
        '',
        '',
        '',
        ''
      ],
      answerType: 'single',
      correctOptionIndex: 0,
      correctOptionIndices: [
        0
      ]
    };

    setQuiz({
      ...quiz,

      questions: [
        ...quiz.questions,
        newQuestion
      ]
    });
  };

  const updateQ = (
    idx,
    field,
    val
  ) => {
    const qs = [
      ...quiz.questions
    ];

    qs[idx] = {
      ...qs[idx],
      [field]: val
    };

    setQuiz({
      ...quiz,
      questions: qs
    });
  };

  const updateOpt = (
    qIdx,
    optIdx,
    val
  ) => {
    const qs = [
      ...quiz.questions
    ];

    const options = [
      ...qs[qIdx].options
    ];

    options[optIdx] =
      val;

    qs[qIdx] = {
      ...qs[qIdx],
      options
    };

    setQuiz({
      ...quiz,
      questions: qs
    });
  };

  const changeAnswerType = (
    qIdx,
    type
  ) => {
    const qs = [
      ...quiz.questions
    ];

    const q = qs[qIdx];

    let indices =
      Array.isArray(
        q.correctOptionIndices
      )
        ? [
            ...q.correctOptionIndices
          ]
        : [
            q.correctOptionIndex ??
              0
          ];

    if (type === 'single') {
      indices = [
        indices[0] ??
          0
      ];
    }

    if (
      type ===
        'multiple' &&
      indices.length === 0
    ) {
      indices = [
        0
      ];
    }

    qs[qIdx] = {
      ...q,
      answerType:
        type,
      correctOptionIndices:
        indices,
      correctOptionIndex:
        indices[0] ??
        0
    };

    setQuiz({
      ...quiz,
      questions: qs
    });
  };

  const toggleCorrect = (
    qIdx,
    optIdx
  ) => {
    const qs = [
      ...quiz.questions
    ];

    const q =
      qs[qIdx];

    const current =
      Array.isArray(
        q.correctOptionIndices
      )
        ? [
            ...q.correctOptionIndices
          ]
        : [
            q.correctOptionIndex ??
              0
          ];

    let next;

    if (
      q.answerType ===
      'multiple'
    ) {
      if (
        current.includes(
          optIdx
        )
      ) {
        next =
          current.filter(
            i =>
              i !==
              optIdx
          );

        /*
         * Keep at least one
         * correct answer.
         */
        if (
          next.length === 0
        ) {
          return;
        }
      } else {
        next = [
          ...current,
          optIdx
        ];
      }
    } else {
      next = [
        optIdx
      ];
    }

    qs[qIdx] = {
      ...q,
      correctOptionIndices:
        next,
      correctOptionIndex:
        next[0]
    };

    setQuiz({
      ...quiz,
      questions: qs
    });
  };

  const deleteQ = id => {
    if (
      quiz.questions.length >
      1
    ) {
      setQuiz({
        ...quiz,

        questions:
          quiz.questions.filter(
            q =>
              q.id !== id
          )
      });
    }
  };

  const handleSave = publish => {
    setSaving(true);

    setTimeout(() => {
      onSave(
        quiz,
        publish
      );

      setSaving(false);
    }, 600);
  };

  return (
    <motion.div
      initial={{
        opacity: 0
      }}
      animate={{
        opacity: 1
      }}
      exit={{
        opacity: 0
      }}
      className="builder-page"
    >

      <div className="builder-toolbar">

        <div className="builder-title-wrap">

          <motion.button
            whileHover={{
              x: -4
            }}
            whileTap={{
              scale: 0.92
            }}
            className="btn-icon"
            onClick={
              onBack
            }
          >
            <ChevronLeft />
          </motion.button>

          <div>

            <span className="eyebrow">
              QUIZ BUILDER
            </span>

            <input
              className="builder-title-input"
              value={
                quiz.title
              }
              onChange={
                e =>
                  setQuiz({
                    ...quiz,
                    title:
                      e.target.value
                  })
              }
              placeholder="Enter Quiz Title..."
            />

          </div>

        </div>

        <div className="builder-actions">

          <AnimatePresence>

            {saving && (

              <motion.span
                initial={{
                  opacity: 0,
                  x: 10
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                exit={{
                  opacity: 0
                }}
                className="saving-indicator"
              >
                <Loader2
                  size={14}
                  className="loader-spin"
                />

                Saving...
              </motion.span>

            )}

          </AnimatePresence>

          <motion.button
            whileHover={{
              scale: 1.03
            }}
            whileTap={{
              scale: 0.97
            }}
            className="btn btn-secondary"
            onClick={() =>
              handleSave(
                false
              )
            }
          >
            <Save
              size={16}
            />

            Save Draft
          </motion.button>

          <motion.button
            whileHover={{
              scale: 1.03
            }}
            whileTap={{
              scale: 0.97
            }}
            className="btn btn-primary"
            onClick={() =>
              handleSave(
                true
              )
            }
            disabled={
              !quiz.title.trim()
            }
          >
            <Play
              size={15}
              fill="currentColor"
            />

            Publish
          </motion.button>

        </div>

      </div>

      <div className="builder-intro">

        <div>
          <span className="eyebrow">
            <Edit3
              size={13}
            />

            QUESTION BUILDER
          </span>

          <h2>
            Build your quiz
          </h2>

          <p>
            Choose how participants
            answer each question.
          </p>
        </div>

        <div className="builder-count">
          <ListChecks
            size={16}
          />

          {quiz.questions.length}{' '}
          questions
        </div>

      </div>

      <div className="builder-questions">

        <AnimatePresence>

          {quiz.questions.map(
            (
              q,
              qIndex
            ) => {

              const correct =
                Array.isArray(
                  q.correctOptionIndices
                )
                  ? q.correctOptionIndices
                  : [
                      q.correctOptionIndex ??
                        0
                    ];

              return (
                <motion.div
                  layout
                  key={q.id}
                  initial={{
                    opacity: 0,
                    y: 18
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.97
                  }}
                  className="card question-card"
                >

                  <div className="question-top">

                    <div className="question-heading">

                      <span className="question-number">
                        Question{' '}
                        {qIndex + 1}
                      </span>

                      <span className="question-small">
                        {q.answerType ===
                        'multiple'
                          ? 'Multiple answer'
                          : 'Single answer'}
                      </span>

                    </div>

                    <motion.button
                      whileHover={{
                        scale: 1.08,
                        rotate: 5
                      }}
                      whileTap={{
                        scale: 0.9
                      }}
                      className="btn-icon danger"
                      onClick={() =>
                        deleteQ(
                          q.id
                        )
                      }
                      disabled={
                        quiz.questions.length ===
                        1
                      }
                    >
                      <Trash2
                        size={16}
                      />
                    </motion.button>

                  </div>

                  <input
                    className="input-base question-input"
                    value={
                      q.questionText
                    }
                    onChange={
                      e =>
                        updateQ(
                          qIndex,
                          'questionText',
                          e.target.value
                        )
                    }
                    placeholder="Type your question..."
                  />

                  <div className="answer-type">

                    <div className="answer-type-label">

                      <span>
                        Answer type
                      </span>

                      <small>
                        Choose one for
                        this question
                      </small>

                    </div>

                    <div className="answer-type-options">

                      <button
                        type="button"
                        className={`answer-type-option ${
                          q.answerType !==
                          'multiple'
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() =>
                          changeAnswerType(
                            qIndex,
                            'single'
                          )
                        }
                      >

                        <CircleDot
                          size={17}
                        />

                        <span>
                          <strong>
                            Single answer
                          </strong>

                          <small>
                            Participants
                            choose one
                          </small>
                        </span>

                        {q.answerType !==
                          'multiple' && (
                          <Check
                            size={15}
                          />
                        )}

                      </button>

                      <button
                        type="button"
                        className={`answer-type-option ${
                          q.answerType ===
                          'multiple'
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() =>
                          changeAnswerType(
                            qIndex,
                            'multiple'
                          )
                        }
                      >

                        <ListChecks
                          size={17}
                        />

                        <span>
                          <strong>
                            Multiple answers
                          </strong>

                          <small>
                            Participants
                            can choose
                            several
                          </small>
                        </span>

                        {q.answerType ===
                          'multiple' && (
                          <Check
                            size={15}
                          />
                        )}

                      </button>

                    </div>

                  </div>

                  <div className="options-label">

                    <span>
                      Answer options
                    </span>

                    <small>
                      {q.answerType ===
                      'multiple'
                        ? 'Select all correct answers'
                        : 'Select the correct answer'}
                    </small>

                  </div>

                  <div className="builder-options">

                    {q.options.map(
                      (
                        opt,
                        optIndex
                      ) => (

                        <div
                          key={
                            optIndex
                          }
                          className="builder-option"
                        >

                          <button
                            type="button"
                            className={`correct-toggle ${
                              correct.includes(
                                optIndex
                              )
                                ? 'correct'
                                : ''
                            } ${
                              q.answerType ===
                              'multiple'
                                ? 'checkbox'
                                : ''
                            }`}
                            onClick={() =>
                              toggleCorrect(
                                qIndex,
                                optIndex
                              )
                            }
                            aria-label={`Mark option ${
                              optIndex + 1
                            } correct`}
                          >

                            {correct.includes(
                              optIndex
                            ) && (
                              <Check
                                size={
                                  15
                                }
                              />
                            )}

                          </button>

                          <span className="option-letter">
                            {String.fromCharCode(
                              65 +
                                optIndex
                            )}
                          </span>

                          <input
                            className="input-base"
                            value={
                              opt
                            }
                            onChange={
                              e =>
                                updateOpt(
                                  qIndex,
                                  optIndex,
                                  e.target.value
                                )
                            }
                            placeholder={`Answer Option ${
                              optIndex + 1
                            }`}
                            style={{
                              borderColor:
                                correct.includes(
                                  optIndex
                                )
                                  ? 'var(--primary)'
                                  : undefined
                            }}
                          />

                          {correct.includes(
                            optIndex
                          ) && (

                            <span className="correct-label">
                              Correct
                            </span>

                          )}

                        </div>

                      )
                    )}

                  </div>

                </motion.div>
              );
            }
          )}

        </AnimatePresence>

        <motion.button
          whileHover={{
            y: -2
          }}
          whileTap={{
            scale: 0.99
          }}
          className="add-question"
          onClick={
            addQuestion
          }
        >
          <Plus
            size={18}
          />

          Add Another Question
        </motion.button>

      </div>

    </motion.div>
  );
}

function QuizPlayer({
  quiz,
  onExit,
  onComplete
}) {
  const normalizedQuiz =
    normalizeQuiz(
      quiz
    );

  const [currentIdx, setCurrentIdx] =
    useState(0);

  const [selectedOpts, setSelectedOpts] =
    useState([]);

  const [score, setScore] =
    useState(0);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [showResults, setShowResults] =
    useState(false);

  const [celebrate, setCelebrate] =
    useState(false);

  const q =
    normalizedQuiz.questions[
      currentIdx
    ];

  const correct =
    Array.isArray(
      q.correctOptionIndices
    )
      ? q.correctOptionIndices
      : [
          q.correctOptionIndex ??
            0
        ];

  const isMultiple =
    q.answerType ===
    'multiple';

  const progress =
    ((currentIdx + 1) /
      normalizedQuiz.questions.length) *
    100;

  const handleSelect = idx => {
    if (
      isSubmitting ||
      showResults
    ) {
      return;
    }

    if (isMultiple) {

      setSelectedOpts(
        prev =>
          prev.includes(
            idx
          )
            ? prev.filter(
                i =>
                  i !== idx
              )
            : [
                ...prev,
                idx
              ]
      );

    } else {

      setSelectedOpts([
        idx
      ]);

    }
  };

  const submitAnswer = () => {
    if (
      selectedOpts.length ===
      0
    ) {
      return;
    }

    const selectedSorted =
      [
        ...selectedOpts
      ].sort(
        (a, b) =>
          a - b
      );

    const correctSorted =
      [
        ...correct
      ].sort(
        (a, b) =>
          a - b
      );

    const isCorrect =
      selectedSorted.length ===
        correctSorted.length &&
      selectedSorted.every(
        (
          value,
          index
        ) =>
          value ===
          correctSorted[
            index
          ]
      );

    const newScore =
      score +
      (isCorrect
        ? 1
        : 0);

    if (
      currentIdx + 1 <
      normalizedQuiz.questions.length
    ) {

      setScore(
        newScore
      );

      setCurrentIdx(
        prev =>
          prev + 1
      );

      setSelectedOpts(
        []
      );

    } else {

      setScore(
        newScore
      );

      setIsSubmitting(
        true
      );

      setTimeout(() => {

        setIsSubmitting(
          false
        );

        setShowResults(
          true
        );

        setCelebrate(
          true
        );

        onComplete(
          newScore
        );

      }, 1100);
    }
  };

  if (isSubmitting) {
    return (
      <div className="player-submit">

        <div className="loading-orbit">
          <Loader2
            size={42}
            className="loader-spin"
          />
        </div>

        <h3>
          Checking your answers...
        </h3>

        <p>
          Almost there.
        </p>

      </div>
    );
  }

  if (showResults) {

    const percentage =
      Math.round(
        (score /
          normalizedQuiz.questions.length) *
          100
      );

    return (
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.94
        }}
        animate={{
          opacity: 1,
          scale: 1
        }}
        className="results-card"
      >

        {celebrate && (
          <Celebration />
        )}

        <div className="result-emoji">
          {percentage >=
          80
            ? '🎉'
            : percentage >=
                50
              ? '✨'
              : '💪'}
        </div>

        <span className="eyebrow centered">
          <Trophy
            size={13}
          />

          FINISHED
        </span>

        <h2>
          Quiz Complete
        </h2>

        <motion.div
          initial={{
            scale: 0
          }}
          animate={{
            scale: 1
          }}
          transition={{
            delay: 0.2,
            type: 'spring'
          }}
          className="result-score"
        >
          {percentage}%
        </motion.div>

        <p>
          You got{' '}
          <strong>
            {score}
          </strong>{' '}
          out of{' '}
          <strong>
            {
              normalizedQuiz
                .questions
                .length
            }
          </strong>{' '}
          correct.
        </p>

        <button
          className="btn btn-primary result-button"
          onClick={
            onExit
          }
        >
          Back to Dashboard
        </button>

      </motion.div>
    );
  }

  return (
    <div className="player-container">

      <div className="player-top">

        <button
          className="btn-icon"
          onClick={
            onExit
          }
        >
          <X
            size={24}
          />
        </button>

        <span className="question-counter">
          Question{' '}
          {currentIdx + 1}{' '}
          of{' '}
          {
            normalizedQuiz
              .questions
              .length
          }
        </span>

        <div className="player-type-badge">

          {isMultiple ? (
            <>
              <ListChecks
                size={14}
              />

              Multi
            </>
          ) : (
            <>
              <CircleDot
                size={14}
              />

              Single
            </>
          )}

        </div>

      </div>

      <div className="progress-bg">

        <motion.div
          className="progress-fill"
          animate={{
            width:
              `${progress}%`
          }}
        />

      </div>

      <AnimatePresence mode="wait">

        <motion.div
          key={currentIdx}
          initial={{
            x: 24,
            opacity: 0
          }}
          animate={{
            x: 0,
            opacity: 1
          }}
          exit={{
            x: -24,
            opacity: 0
          }}
          transition={{
            duration: 0.22
          }}
        >

          <div className="player-question">

            <span className="eyebrow centered">
              {isMultiple
                ? 'SELECT ALL THAT APPLY'
                : 'SELECT ONE'}
            </span>

            <h2>
              {q.questionText ||
                'Untitled Question'}
            </h2>

          </div>

          <div className="player-options">

            {q.options.map(
              (
                opt,
                idx
              ) => {

                const selected =
                  selectedOpts.includes(
                    idx
                  );

                return (
                  <motion.button
                    type="button"
                    key={
                      idx
                    }
                    whileHover={{
                      scale: 0.995,
                      y: -2
                    }}
                    whileTap={{
                      scale: 0.985
                    }}
                    className={`player-option ${
                      selected
                        ? 'selected'
                        : ''
                    } ${
                      isMultiple
                        ? 'multi'
                        : ''
                    }`}
                    onClick={() =>
                      handleSelect(
                        idx
                      )
                    }
                  >

                    <span
                      className={`player-selector ${
                        selected
                          ? 'selected'
                          : ''
                      }`}
                    >
                      {selected && (
                        <Check
                          size={
                            15
                          }
                        />
                      )}
                    </span>

                    <span className="player-letter">
                      {String.fromCharCode(
                        65 +
                          idx
                      )}
                    </span>

                    <span>
                      {opt ||
                        `Option ${
                          idx + 1
                        }`}
                    </span>

                  </motion.button>
                );
              }
            )}

          </div>

          <motion.button
            whileHover={{
              y: -2
            }}
            whileTap={{
              scale: 0.98
            }}
            className="btn btn-primary submit-answer"
            disabled={
              selectedOpts.length ===
              0
            }
            onClick={
              submitAnswer
            }
          >

            {currentIdx + 1 ===
            normalizedQuiz.questions.length
              ? 'Finish Quiz'
              : 'Continue'}

            <ChevronLeft
              size={17}
              className="rotate-180"
            />

          </motion.button>

        </motion.div>

      </AnimatePresence>

    </div>
  );
}

function Celebration() {
  return (
    <div
      className="celebration"
      aria-hidden="true"
    >

      {[...Array(18)].map(
        (_, i) => (

          <motion.i
            key={i}
            initial={{
              opacity: 0,
              y: 40,
              x: 0,
              rotate: 0,
              scale: 0.5
            }}
            animate={{
              opacity: [
                0,
                1,
                1,
                0
              ],

              y:
                -150 -
                (i % 5) *
                  35,

              x:
                (i % 2
                  ? 1
                  : -1) *
                (35 +
                  (i * 17) %
                    130),

              rotate:
                180 +
                i * 35,

              scale: [
                0.5,
                1,
                0.7
              ]
            }}
            transition={{
              duration:
                1.8 +
                (i % 4) *
                  0.15,

              delay:
                i * 0.025,

              ease:
                'easeOut'
            }}
            style={{
              '--i': i
            }}
          />

        )
      )}

    </div>
  );
}
function CustomCursor() {
const [hovering, setHovering] = useState(false);

useEffect(() => {
let idleTimer;


const moveCursor = (e) => {
  const cursor = document.querySelector('.custom-cursor');

  if (cursor) {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
  }

  document.documentElement.style.setProperty(
    '--idle-opacity',
    '0.06'
  );

  clearTimeout(idleTimer);

  idleTimer = setTimeout(() => {
    document.documentElement.style.setProperty(
      '--idle-opacity',
      '0.24'
    );
  }, 2000);

  const target = e.target;

  const interactive =
    target.closest(
      'button, a, input, .card, .nav-item, .theme-card, .player-option'
    );

  setHovering(Boolean(interactive));

  if (
    window.innerWidth > 650 &&
    Math.random() > 0.72
  ) {
    const trail = document.createElement('div');

    trail.className = 'cursor-trail';

    trail.style.left = `${e.clientX}px`;
    trail.style.top = `${e.clientY}px`;

    document.body.appendChild(trail);

    setTimeout(() => {
      trail.remove();
    }, 600);
  }
};

const resetIdle = () => {
  clearTimeout(idleTimer);

  idleTimer = setTimeout(() => {
    document.documentElement.style.setProperty(
      '--idle-opacity',
      '0.24'
    );
  }, 2000);
};

window.addEventListener(
  'mousemove',
  moveCursor
);

window.addEventListener(
  'mouseleave',
  resetIdle
);

resetIdle();

return () => {
  window.removeEventListener(
    'mousemove',
    moveCursor
  );

  window.removeEventListener(
    'mouseleave',
    resetIdle
  );

  clearTimeout(idleTimer);
};


}, []);

return (
<div
className={`custom-cursor ${
        hovering ? 'hovering' : ''
      }`}
aria-hidden="true"
> <div className="cursor-star" /> </div>
);
}
