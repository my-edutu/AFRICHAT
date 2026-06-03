import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface LearnModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  triggerToast: (msg: string) => void;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctIdx: number;
}

interface Course {
  id: string;
  title: string;
  category: string;
  lessons: number;
  duration: string;
  image: string;
  instructor: string;
  enrolled: boolean;
  questions?: Question[];
}

export default function LearnModal({
  isOpen,
  onClose,
  theme,
  triggerToast
}: LearnModalProps) {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: "course-1",
      title: "Introduction to African Fintech & Web3 Nodes",
      category: "Technology",
      lessons: 8,
      duration: "4.5 Hrs",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80",
      instructor: "Dr. Abidemi Folake",
      enrolled: true,
      questions: [
        {
          id: "q-1",
          text: "Which of these is Africa's record-breaking pioneer mobile money platform?",
          options: ["M-Pesa", "Stripe", "PayPal", "Venmo"],
          correctIdx: 0
        },
        {
          id: "q-2",
          text: "What currency protocol does AfriPay primarily use to settle cross-border instant conversion rates?",
          options: ["Celo Stablecoins", "Standard SWIFT Nodes", "Unified Ledger Relays", "USSD Carrier SMS"],
          correctIdx: 2
        }
      ]
    },
    {
      id: "course-2",
      title: "Sustainable Agricultural Crop Management in Akure",
      category: "Agriculture",
      lessons: 12,
      duration: "6.2 Hrs",
      image: "https://images.unsplash.com/photo-1595151402445-6615b824ca3f?w=400&q=80",
      instructor: "Prof. Kofi Mensah",
      enrolled: false
    }
  ]);

  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const handleEnroll = (courseId: string) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, enrolled: true } : c));
    triggerToast("Enrolled in course! Your progress coordinates have been initialized.");
  };

  const handleAnswerSubmit = (optionIdx: number) => {
    if (isAnswered || !activeCourse?.questions) return;
    setSelectedOption(optionIdx);
    setIsAnswered(true);

    const isCorrect = optionIdx === activeCourse.questions[activeQuestionIdx].correctIdx;
    if (isCorrect) {
      setScore(prev => prev + 10);
      triggerToast("Excellent! Correct answer! +10 AfriRewards Points.");
    } else {
      triggerToast("Incorrect answer. Study the modules and try again!");
    }
  };

  const handleNextQuestion = () => {
    if (!activeCourse?.questions) return;
    if (activeQuestionIdx < activeCourse.questions.length - 1) {
      setActiveQuestionIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      triggerToast(`Course Challenge Quiz completed! Total Rewards accrued: ${score} Points.`);
      // Reset quiz
      setActiveCourse(null);
      setActiveQuestionIdx(0);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-on-surface overflow-hidden">
      {/* Header */}
      <header className="bg-[#006A42] text-white py-4 px-6 flex justify-between items-center z-10 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">AfriLearn Hub</h1>
            <p className="text-[10px] text-emerald-250">Acquire expert skills • Accumulate Reward points</p>
          </div>
        </div>
        <div className="bg-yellow-400 text-neutral-950 font-black text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]">military_tech</span>
          <span>{score} pts</span>
        </div>
      </header>

      {/* Main Grid content list */}
      <div className="flex-grow overflow-y-auto pb-24">
        {/* Banner */}
        <section className="bg-gradient-to-r from-emerald-800 to-[#1D7AFC] text-white p-6 relative select-none">
          <h2 className="text-xl font-extrabold leading-tight">Upskill with AfriLearn Digital Accreditations</h2>
          <p className="text-xs text-blue-100 mt-2 max-w-sm">Every successfully parsed dynamic quiz credits points directly redeemable on airtime and electricity tokens.</p>
        </section>

        {/* Course feed */}
        <section className="p-6 space-y-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-emerald-600 dark:text-[#6ddb9f]">Available Accreditations</h3>
          
          <div className="space-y-4">
            {courses.map((course) => (
              <div 
                key={course.id}
                className={`rounded-3xl border overflow-hidden transition-all ${
                theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-white border-neutral-200 shadow-sm'
                }`}
              >
                <div className="h-40 relative select-none">
                  <img className="w-full h-full object-cover" src={course.image} alt="" />
                  <span className="absolute top-3 left-3 bg-black/60 text-white font-bold text-[9px] px-2.5 py-1 rounded-full">
                    {course.category}
                  </span>
                  <span className="absolute bottom-3 right-3 bg-[#006A42] text-white font-black text-[9px] px-3 py-1 rounded-md border border-emerald-500/20">
                    {course.duration}
                  </span>
                </div>

                <div className="p-5 space-y-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Instructor: {course.instructor}</span>
                  <h4 className="font-extrabold text-sm leading-tight text-neutral-900 dark:text-white">{course.title}</h4>
                  <p className="text-[11px] text-gray-500">{course.lessons} comprehensive video syllabus modules.</p>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-gray-200/10 flex items-center justify-between">
                  {course.enrolled ? (
                    course.questions ? (
                      <button 
                        onClick={() => {
                          setActiveCourse(course);
                          setActiveQuestionIdx(0);
                          setSelectedOption(null);
                          setIsAnswered(false);
                          triggerToast(`Synthesized Quiz for: ${course.title}`);
                        }}
                        className="bg-yellow-400 hover:bg-yellow-500 text-neutral-950 text-xs font-black px-6 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[15px]">quiz</span>
                        Take Quiz Challenge
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-500 font-extrabold tracking-wide uppercase flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        Module Completed
                      </span>
                    )
                  ) : (
                    <button 
                      onClick={() => handleEnroll(course.id)}
                      className="bg-[#006A42] hover:bg-[#0A8F5A] text-white text-xs font-bold px-5 py-2.5 rounded-xl"
                    >
                      Enroll Free
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* QUIZ DRAWER OVERLAY */}
      <AnimatePresence>
        {activeCourse && activeCourse.questions && (
          <div className="fixed inset-0 z-55 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs" onClick={() => setActiveCourse(null)}></div>
            
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className={`w-full max-w-lg rounded-t-[32px] p-6 border-t shadow-2xl relative z-10 ${
                theme === 'dark' ? 'bg-[#15221b] border-white/10 text-white' : 'bg-white border-gray-200 text-neutral-900'
              }`}
            >
              <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto mb-5"></div>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-black/15 p-3 rounded-2xl border border-white/3">
                  <div>
                    <span className="text-[8px] text-yellow-400 uppercase font-black tracking-widest leading-none">Course Series Challenge</span>
                    <h4 className="font-extrabold text-xs text-white-900 mt-1 truncate w-44">{activeCourse.title}</h4>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/20">
                    Q {activeQuestionIdx + 1} of {activeCourse.questions.length}
                  </span>
                </div>

                {/* Question block */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-neutral-900 dark:text-white text-sm leading-relaxed">
                    {activeCourse.questions[activeQuestionIdx].text}
                  </h3>
                  
                  <div className="space-y-2 pt-2">
                    {activeCourse.questions[activeQuestionIdx].options.map((opt, oIdx) => {
                      const isSelected = selectedOption === oIdx;
                      const isCorrectAnswer = oIdx === activeCourse.questions[activeQuestionIdx].correctIdx;
                      let bgBorderClass = "bg-black/10 border-white/5 hover:bg-black/20 text-gray-300";

                      if (isAnswered) {
                        if (isCorrectAnswer) {
                          bgBorderClass = "bg-emerald-500/15 border-emerald-400 text-emerald-400 font-semibold";
                        } else if (isSelected) {
                          bgBorderClass = "bg-red-500/15 border-red-400 text-red-400";
                        } else {
                          bgBorderClass = "bg-black/5 border-white/3 text-gray-500 opacity-60";
                        }
                      } else if (isSelected) {
                        bgBorderClass = "bg-yellow-400/10 border-yellow-400 text-yellow-400 font-semibold";
                      }

                      return (
                        <div 
                          key={oIdx}
                          onClick={() => !isAnswered && handleAnswerSubmit(oIdx)}
                          className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all select-none flex items-center justify-between ${bgBorderClass}`}
                        >
                          <span>{opt}</span>
                          {isAnswered && isCorrectAnswer && (
                            <span className="material-symbols-outlined text-[16px] text-emerald-400 font-bold">check_circle</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {isAnswered && (
                  <button 
                    onClick={handleNextQuestion}
                    className="w-full bg-[#0A8F5A] text-white py-3 mt-4 rounded-xl text-xs font-black select-none"
                  >
                    {activeQuestionIdx < activeCourse.questions.length - 1 ? "Next Challenge Question" : "Complete & Fetch Grading"}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
