module.exports = function(fn){
    return (req,res,next)=>{
        fn(req,res,next).catch(err=>next(err))  //catch(err=>next(err)) this is equilvalent to catch(next);
    }
}