import Link from 'next/link';

export default function HomePage() {
  return (
      <div 
            className="min-h-screen flex flex-col items-center justify-center p-8"
                  style={{ backgroundColor: '#191B1C' }}
                      >
                            <div className="max-w-2xl text-center">
                                    {/* Header */}
                                            <h1 className="text-6xl font-bold text-white mb-6">
                                                      Corruchart
                                                              </h1>
                                                                      
                                                                              {/* Information Paragraph */}
                                                                                      <p className="text-md text-gray-300 mb-8 leading-relaxed">
                                                                                                Welcome to Corruchart (Corruption Chart). This interactive tool allows you to 
                                                                                                          indicate your sexual interests on a large and sprawling chart to learn more about yourself and/or share with others. There are currently hundreds of interests available for you to weigh on, but to save space and time, interests are not as granular as they could be (every possible orientation and combination of interest). To solve this, the results page attempts to be informative using a person's chart to solve this.
                                                                                                                  </p>
                                                                                                                          <p className="text-md text-gray-300 mb-8 leading-relaxed">
                                                                                                                                    Disclaimer: This tool is designed for fun and informative purposes, NONE of the interests (especially the taboo ones) are endorsed and/or condoned by the creator of this tool. The interests available are interests that real people have (even if you don't believe it). The creator assumes no responsibility for any consequences that arise from the use of this tool. Please exercise discretion when using it and sharing results.
                                                                                                                                            </p>
                                                                                                                                                    
                                                                                                                                                            {/* Begin Button/Link */}
                                                                                                                                                                    <Link 
                                                                                                                                                                              href="/corruchart"
                                                                                                                                                                                        className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-violet-800 hover:bg-violet-900 focus:outline-none transition-colors duration-200"
                                                                                                                                                                                                >
                                                                                                                                                                                                          Begin
                                                                                                                                                                                                                  </Link>
                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                              );
                                                                                                                                                                                                                              }