'use client';

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Building2, MapPin, Clock, DollarSign, Trash2} from "lucide-react";
import { getJobListings, deleteJob } from "@/utils/actions/jobs/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";


type WorkLocationType = 'remote' | 'in_person' | 'hybrid';
type EmploymentType = 'full_time' | 'part_time' | 'co_op' | 'internship' | 'contract';

interface Job {
  id: string;
  company_name: string;
  position_title: string;
  location: string | null;
  work_location: WorkLocationType | null;
  employment_type: EmploymentType | null;
  salary_range: string | null;
  created_at: string;
  keywords: string[] | null;
}

export function JobListingsCard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [workLocation, setWorkLocation] = useState<WorkLocationType | undefined>();
  const [employmentType, setEmploymentType] = useState<EmploymentType | undefined>();

  // In single-user / CF Access mode, the user is always the admin
  const isAdmin = true;

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getJobListings({
        page: currentPage,
        pageSize: 6,
        filters: {
          workLocation,
          employmentType
        }
      });
      setJobs(result.jobs);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, workLocation, employmentType]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  const formatWorkLocation = (workLocation: Job['work_location']) => {
    if (!workLocation) return 'Not specified';
    return workLocation.replace('_', ' ');
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await deleteJob(jobId);
      // Refetch jobs after deletion
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  return (
    <div className="relative">
      <Card className="relative p-8 bg-white/60 backdrop-blur-2xl border-dia-divider shadow-dia rounded-dia overflow-hidden">

        <div className="relative flex flex-col space-y-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-light text-foreground"
            >
              Job Listings
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <div className="relative group">
                <Select
                  value={workLocation}
                  onValueChange={(value: WorkLocationType) => setWorkLocation(value)}
                >
                  <SelectTrigger className="w-full sm:w-[180px] bg-white/80 backdrop-blur-xl border-dia-divider shadow-dia hover:shadow-dia transition-all duration-300 hover:border-border">
                    <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Work Location" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 backdrop-blur-xl border-dia-divider">
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative group">
                <Select
                  value={employmentType}
                  onValueChange={(value: EmploymentType) => setEmploymentType(value)}
                >
                  <SelectTrigger className="w-full sm:w-[180px] bg-white/80 backdrop-blur-xl border-dia-divider shadow-dia hover:shadow-dia transition-all duration-300 hover:border-border">
                    <Briefcase className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 backdrop-blur-xl border-dia-divider">
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="co_op">Co-op</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="p-6 space-y-4 animate-pulse bg-muted/40 border-dia-divider rounded-dia-sm">
                    <div className="h-6 bg-muted rounded-full w-3/4" />
                    <div className="h-4 bg-muted rounded-full w-1/2" />
                    <div className="h-4 bg-muted rounded-full w-2/3" />
                  </Card>
                </motion.div>
              ))
            ) : jobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="group relative p-6 space-y-5 hover:shadow-dia transition-all duration-500 ease-out bg-white/80 hover:bg-white/90 border-dia-divider hover:border-border rounded-dia-sm overflow-hidden hover:-translate-y-1">

                  <div className="flex justify-between items-start">
                    <div className="space-y-2.5">
                      <h3 className="font-normal text-lg line-clamp-1 text-foreground group-hover:text-foreground transition-colors duration-300">
                        {job.position_title}
                      </h3>
                      <div className="flex items-center text-muted-foreground">
                        <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="line-clamp-1 group-hover:text-foreground transition-colors duration-300">
                          {job.company_name}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-50/50 transition-all duration-300"
                        onClick={() => handleDeleteJob(job.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 group-hover:text-foreground transition-colors duration-300">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2 group-hover:text-foreground transition-colors duration-300">
                      <Briefcase className="w-4 h-4" />
                      <span className="capitalize">{formatWorkLocation(job.work_location)}</span>
                    </div>
                    <div className="flex items-center gap-2 group-hover:text-foreground transition-colors duration-300">
                      <DollarSign className="w-4 h-4" />
                      <span>{job.salary_range}</span>
                    </div>
                    <div className="flex items-center gap-2 group-hover:text-foreground transition-colors duration-300">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(job.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {job.keywords?.slice(0, 3).map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs bg-muted text-foreground hover:bg-dia-divider transition-all duration-300 border border-dia-divider"
                      >
                        {keyword}
                      </Badge>
                    ))}
                    {job.keywords && job.keywords.length > 3 && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-muted text-muted-foreground hover:bg-dia-divider transition-all duration-300 border border-dia-divider"
                      >
                        +{job.keywords.length - 3} more
                      </Badge>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center gap-4 mt-6"
          >
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
              className="bg-white border-dia-divider hover:bg-muted hover:border-border transition-all duration-300 disabled:opacity-50 px-6"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoading}
              className="bg-white border-dia-divider hover:bg-muted hover:border-border transition-all duration-300 disabled:opacity-50 px-6"
            >
              Next
            </Button>
          </motion.div>
        </div>
      </Card>
    </div>
  );
}
